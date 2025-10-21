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

    const { message, threadId } = await request.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get the health wellness agent
    const healthAgent = mastra.getAgent('healthWellnessAgent');
    
    // Create runtime context with authenticated Supabase client
    const runtimeContext = new RuntimeContext();
    runtimeContext.set('supabase', supabase);
    runtimeContext.set('userId', user.id);

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try primary model first
          let response;
          try {
            response = await healthAgent.stream(message, {
              memory: {
                thread: threadId || `health-assistant-${user.id}`,
                resource: user.id,
              },
              runtimeContext,
            });
          } catch (error: any) {
            // If primary model fails with 503 (overloaded), try fallback
            if (error.statusCode === 503 || error.message?.includes('overloaded')) {
              console.log('Primary model overloaded, trying fallback model...');
              
              // Create a new agent instance with fallback model
              const fallbackModel = google('gemini-2.5-flash');
              const fallbackAgent = new (await import('@mastra/core/agent')).Agent({
                name: healthAgent.name,
                instructions: healthAgent.instructions,
                model: fallbackModel,
                tools: healthAgent.tools,
              });
              
              response = await fallbackAgent.stream(message, {
                memory: {
                  thread: threadId || `health-assistant-${user.id}`,
                  resource: user.id,
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
