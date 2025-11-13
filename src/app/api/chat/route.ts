import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mastra } from '@/mastra';
import { google } from '@ai-sdk/google';
import { RuntimeContext } from '@mastra/core/runtime-context';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, threadId, currentPage, overlayState } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // All authenticated users go to longevity coach
    const agent = mastra.getAgent('longevityCoachAgent');
    
    // Create runtime context with authenticated Supabase client
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('supabase', supabase);
    runtimeContext.set('userId', user.id);
    if (currentPage) {
      runtimeContext.set('currentPage', currentPage);
    }
    if (overlayState) {
      runtimeContext.set('overlayState', overlayState);
    }

    // Load active and draft routines into runtime context for every message
    // Query for active routine
    const { data: activeRoutine, error: activeError } = await supabase
      .from('user_routines')
      .select('id, content, version, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single();

    // Query for draft routine
    const { data: draftRoutine, error: draftError } = await supabase
      .from('user_routines')
      .select('id, content, version, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    // Handle errors gracefully - no routine is not an error
    const activeRoutineValue = activeError && activeError.code === 'PGRST116' ? null : activeRoutine;
    const draftRoutineValue = draftError && draftError.code === 'PGRST116' ? null : draftRoutine;

    // Add routines to runtime context
    runtimeContext.set('activeRoutine', activeRoutineValue);
    runtimeContext.set('draftRoutine', draftRoutineValue);

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try primary model first
          let response;
          try {
            response = await agent.stream(message, {
              memory: {
                thread: threadId || `longevity-coach-${user.id}`,
                resource: `longevity-coach-${user.id}`,
              },
              runtimeContext,
            });
          } catch (error: any) {
            // If primary model fails with 503 (overloaded), try fallback
            if (error.statusCode === 503 || error.message?.includes('overloaded')) {
              console.log('Primary model overloaded, trying fallback model...');
              
              // Create a new agent instance with fallback model
              const fallbackModel = google('gemini-2.5-flash');
              const { Agent } = await import('@mastra/core/agent');
              const fallbackAgent = new Agent({
                name: agent.name,
                instructions: agent.instructions,
                model: fallbackModel,
                tools: agent.tools,
              });
              
              response = await fallbackAgent.stream(message, {
                memory: {
                  thread: threadId || `longevity-coach-${user.id}`,
                  resource: `longevity-coach-${user.id}`,
                },
                runtimeContext,
              });
            } else {
              throw error;
            }
          }

          // Stream the response back to the client
          for await (const chunk of response.textStream) {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in chat stream:', error);
          const encoder = new TextEncoder();
          let errorMessage = 'An error occurred while processing your message';
          
          if (error instanceof Error) {
            if (error.message.includes('overloaded')) {
              errorMessage = 'The AI service is temporarily overloaded. Please try again in a few moments.';
            } else if (error.message.includes('503')) {
              errorMessage = 'The AI service is temporarily unavailable. Please try again later.';
            }
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
