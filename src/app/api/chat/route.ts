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

          const encoder = new TextEncoder();
          
          // Map Mastra tool names (variable names) to tool IDs (kebab-case)
          // Mastra returns the variable name like "updateDraftRoutineTool" but we need the ID like "update-draft-routine"
          const toolNameToIdMap: Record<string, string> = {
            'createDraftRoutineTool': 'create-draft-routine',
            'updateDraftRoutineTool': 'update-draft-routine',
            'activateDraftRoutineTool': 'activate-draft-routine',
            'getDraftRoutineTool': 'get-draft-routine',
            'getActiveRoutineTool': 'get-active-routine',
          };
          
          // Routine tool IDs to watch for (these are the IDs we'll emit to the client)
          const routineToolIds = [
            'create-draft-routine',
            'update-draft-routine',
            'activate-draft-routine',
          ];

          // Stream both text content and tool results
          // Use fullStream to access tool results
          for await (const chunk of response.fullStream) {
            // Handle text content
            if (chunk.type === 'text-delta') {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.payload.text })}\n\n`)
              );
            }
            
            // Handle tool results for routine tools
            if (chunk.type === 'tool-result') {
              console.log('[CHAT API] Tool result chunk received:', {
                chunkType: chunk.type,
                payload: chunk.payload,
                toolName: chunk.payload?.toolName,
                toolId: chunk.payload?.toolId,
                hasResult: !!chunk.payload?.result,
                resultKeys: chunk.payload?.result ? Object.keys(chunk.payload.result) : null,
                isError: chunk.payload?.isError,
                fullPayload: JSON.stringify(chunk.payload, null, 2),
              });
              
              // Get the tool name from payload (Mastra returns variable name like "updateDraftRoutineTool")
              const mastraToolName = chunk.payload.toolName || chunk.payload.toolId;
              
              // Map Mastra tool name to tool ID (kebab-case)
              const toolId = mastraToolName && toolNameToIdMap[mastraToolName] 
                ? toolNameToIdMap[mastraToolName] 
                : mastraToolName; // Fallback to original name if not in map
              
              console.log('[CHAT API] Tool name mapping:', {
                mastraToolName,
                mappedToolId: toolId,
                isRoutineTool: toolId && routineToolIds.includes(toolId),
              });
              
              if (toolId && routineToolIds.includes(toolId)) {
                console.log('[CHAT API] Emitting tool result for routine tool:', {
                  mastraToolName,
                  toolId,
                  result: chunk.payload.result,
                  isError: chunk.payload.isError || false,
                });
                
                // Check if result is an error (Error object or marked as error)
                // Mastra wraps errors in Error objects with message property
                // When serialized, Error objects become plain objects with message property
                const result = chunk.payload.result;
                
                // Detect error: has isError flag, or has error-like structure (message property, or TOOL_EXECUTION_FAILED id)
                const isError = chunk.payload.isError || 
                  (result && typeof result === 'object' && (
                    'message' in result || 
                    result.id === 'TOOL_EXECUTION_FAILED' ||
                    result.details?.errorMessage
                  ));
                
                console.log('[CHAT API] Error detection:', {
                  hasIsErrorFlag: !!chunk.payload.isError,
                  hasMessage: !!(result && typeof result === 'object' && 'message' in result),
                  hasErrorId: !!(result && result.id === 'TOOL_EXECUTION_FAILED'),
                  isError,
                  resultType: typeof result,
                  resultKeys: result && typeof result === 'object' ? Object.keys(result) : null,
                });
                
                // Extract error message from various possible formats
                let errorMessage = '';
                if (isError && result) {
                  if (typeof result === 'string') {
                    errorMessage = result;
                  } else if (result instanceof Error) {
                    errorMessage = result.message;
                  } else if (result.message) {
                    // Primary: direct message property
                    errorMessage = result.message;
                  } else if (result.details?.message) {
                    // Fallback: details.message
                    errorMessage = result.details.message;
                  } else if (result.details?.errorMessage) {
                    // Fallback: details.errorMessage
                    errorMessage = result.details.errorMessage;
                  } else if (result.error) {
                    errorMessage = result.error;
                  } else {
                    errorMessage = JSON.stringify(result);
                  }
                }
                
                console.log('[CHAT API] Extracted error message:', {
                  errorMessage,
                  messageLength: errorMessage.length,
                });
                
                // Check if error is subscription-related
                const isSubscriptionError = isError && 
                  errorMessage &&
                  (errorMessage.includes('Pro subscription') || 
                   errorMessage.includes('subscription') ||
                   errorMessage.includes('upgrade'));
                
                console.log('[CHAT API] Subscription error check:', {
                  isError,
                  hasErrorMessage: !!errorMessage,
                  isSubscriptionError,
                  errorMessagePreview: errorMessage.substring(0, 100),
                });
                
                // Emit tool result event for routine tools with the mapped tool ID
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: 'tool-result',
                      toolId: toolId,
                      result: chunk.payload.result,
                      isError: chunk.payload.isError || false,
                    })}\n\n`
                  )
                );
                
                // If subscription error, emit upgrade-required event
                if (isSubscriptionError) {
                  console.log('[CHAT API] Emitting upgrade-required event');
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'upgrade-required',
                      })}\n\n`
                    )
                  );
                }
              } else {
                console.log('[CHAT API] Tool result not for routine tool or missing tool name:', {
                  mastraToolName,
                  mappedToolId: toolId,
                  isInRoutineList: toolId ? routineToolIds.includes(toolId) : false,
                  routineToolIds,
                });
              }
            } else if (chunk.type) {
              // Log other chunk types for debugging
              console.log('[CHAT API] Other chunk type:', chunk.type, chunk.payload ? Object.keys(chunk.payload) : 'no payload');
            }
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
