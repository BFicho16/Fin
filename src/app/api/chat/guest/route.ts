import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
console.log('[GUEST ROUTE] Importing guestMastra...');
import { guestMastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/runtime-context';

export async function POST(request: NextRequest) {
  try {
    const { message, guestSessionId } = await request.json();
    
    const supabase = await createClient();
    let sessionId = guestSessionId;
    
    if (!sessionId) {
      // Create new session with pre-populated routine structure
      console.log('Creating new guest session...');
      
      // Generate empty routine structure for all days and times
      const emptyRoutines = [];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timeSlots = ['morning', 'midday', 'night', 'workout'];
      
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        for (const timeOfDay of timeSlots) {
          emptyRoutines.push({
            routine_name: `${days[dayOfWeek]} ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`,
            day_of_week: dayOfWeek,
            time_of_day: timeOfDay,
            status: 'active',
            items: [],
            temp_routine_id: `temp-${Date.now()}-${dayOfWeek}-${timeOfDay}`
          });
        }
      }
      
      const { data, error } = await supabase
        .from('guest_onboarding_sessions')
        .insert({ 
          routines: emptyRoutines 
        })
        .select('session_id')
        .single();
      
      if (error) {
        console.error('Error creating guest session:', error);
        return Response.json({ error: 'Failed to create session' }, { status: 500 });
      }
      
      sessionId = data.session_id;
      console.log('Created guest session with pre-populated routines:', sessionId);
    } else {
      // Check if session actually exists in database
      console.log('Checking if session exists:', sessionId);
      const { data: existingSession, error: fetchError } = await supabase
        .from('guest_onboarding_sessions')
        .select('session_id')
        .eq('session_id', sessionId)
        .single();
        
      if (fetchError || !existingSession) {
        console.log('Session not found in database, creating new session with pre-populated routines');
        
        // Generate empty routine structure for all days and times
        const emptyRoutines = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timeSlots = ['morning', 'midday', 'night', 'workout'];
        
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
          for (const timeOfDay of timeSlots) {
            emptyRoutines.push({
              routine_name: `${days[dayOfWeek]} ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}`,
              day_of_week: dayOfWeek,
              time_of_day: timeOfDay,
              status: 'active',
              items: [],
              temp_routine_id: `temp-${Date.now()}-${dayOfWeek}-${timeOfDay}`
            });
          }
        }
        
        const { data, error } = await supabase
          .from('guest_onboarding_sessions')
          .insert({ 
            routines: emptyRoutines 
          })
          .select('session_id')
          .single();
          
        if (error) {
          console.error('Error creating new session:', error);
          return Response.json({ error: 'Failed to create session' }, { status: 500 });
        }
        
        sessionId = data.session_id;
        console.log('Created new session with pre-populated routines:', sessionId);
        
        // Clear any existing memory for the old session ID to ensure fresh start
        try {
          const oldResourceId = `guest-${guestSessionId}`;
          console.log('Clearing memory for old session:', oldResourceId);
          // Note: Memory clearing would go here if we had direct access
        } catch (error) {
          console.log('No old memory to clear');
        }
      } else {
        // Session exists, update last_accessed
        console.log('Updating existing session:', sessionId);
        const { error } = await supabase
          .from('guest_onboarding_sessions')
          .update({ last_accessed: new Date().toISOString() })
          .eq('session_id', sessionId);
          
        if (error) {
          console.error('Error updating session:', error);
        }
      }
    }
    
    // Helper function to fetch and format session data
    const getSessionContext = async (sessionId: string) => {
      console.log('Fetching session context for:', sessionId);
      const { data: sessionData, error } = await supabase
        .from('guest_onboarding_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
        
      if (error) {
        console.error('Error fetching session context:', error);
        // Return empty context if session not found
        return {
          role: 'system' as const,
          content: `# Current Session State (Session ID: ${sessionId})

## Profile Data
{}

## Health Metrics  
[]

## Dietary Preferences
{}

## All Routines (0 total)
[]

**IMPORTANT**: This is the COMPLETE current state. Any data shown above has already been collected. Do not ask for it again. When deleting, use exact names from above.

**CRITICAL: Ignore Old Memory**
If your working memory or semantic recall contains information that conflicts with the system context above, IGNORE the old memory and trust ONLY the system context. The system context is the single source of truth for what data has been collected.`
        };
      }

      return {
        role: 'system' as const,
        content: `# Current Session State (Session ID: ${sessionId})

## Profile Data
${JSON.stringify(sessionData?.profile || {}, null, 2)}

## Health Metrics  
${JSON.stringify(sessionData?.health_metrics || [], null, 2)}

## Dietary Preferences
${JSON.stringify(sessionData?.dietary_preferences || {}, null, 2)}

## All Routines (${(sessionData?.routines || []).length} total)
${JSON.stringify(sessionData?.routines || [], null, 2)}

**IMPORTANT**: This is the COMPLETE current state. Any data shown above has already been collected. Do not ask for it again. When deleting, use exact names from above.

**CRITICAL: Ignore Old Memory**
If your working memory or semantic recall contains information that conflicts with the system context above, IGNORE the old memory and trust ONLY the system context. The system context is the single source of truth for what data has been collected.`
      };
    };

    // Get initial session context
    const contextMessage = await getSessionContext(sessionId);

    // Get guest onboarding agent
    const agent = guestMastra.getAgent('guestOnboardingAgent');
    
    // Runtime context with ONLY guest session ID
    const runtimeContext = new RuntimeContext();
    (runtimeContext as any).set('guestSessionId', sessionId);
    
    // Get conversation history from memory
    let conversationHistory = [];
    try {
      const memory = await agent.getMemory();
      if (memory) {
        const threadId = `guest-onboarding-${sessionId}`;
        const { uiMessages } = await memory.query({
          threadId,
          resourceId: `guest-${sessionId}`,
          selectBy: {
            last: 20, // Get last 20 messages for context
          },
        });
        
        // Transform messages for agent consumption
        conversationHistory = uiMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    } catch (error) {
      console.log('No conversation history found for session:', sessionId);
      // This is normal for new sessions
    }
    
    // Stream response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send session ID first
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sessionId })}\n\n`)
        );
        
        try {
          // Build message array with context and conversation history
          const messages = [
            contextMessage,  // Current session state
            ...conversationHistory,  // Previous conversation
            { role: 'user', content: message }  // Current user message
          ];
          
          const response = await agent.stream(messages, {
            memory: {
              thread: `guest-onboarding-${sessionId}`,
              resource: `guest-${sessionId}`,
            },
            runtimeContext,
          });
          
          // Stream chunks
          for await (const chunk of response.textStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
            );
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in guest chat:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          const errorStack = error instanceof Error ? error.stack : undefined;
          console.error('Full error details:', { errorMessage, errorStack, error });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage, details: errorStack })}\n\n`)
          );
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
    console.error('Error in guest chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Full API error details:', { errorMessage, errorStack, error });
    return Response.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      stack: errorStack 
    }, { status: 500 });
  }
}
