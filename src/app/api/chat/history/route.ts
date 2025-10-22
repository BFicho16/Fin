import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mastra } from '@/mastra';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user's onboarding status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    // Get the appropriate agent based on onboarding status
    const agent = profile?.onboarding_completed 
      ? mastra.getAgent('longevityCoachAgent')
      : mastra.getAgent('onboardingAgent');
    
    const memory = await agent.getMemory();

    if (!memory) {
      return Response.json({ error: 'Memory not available' }, { status: 500 });
    }

    // Use the same thread ID format as the chat API
    const threadId = profile?.onboarding_completed ? `longevity-coach-${user.id}` : `onboarding-${user.id}`;

    // Query the memory for messages in this thread
    try {
      const { uiMessages } = await memory.query({
        threadId,
        resourceId: profile?.onboarding_completed ? `longevity-coach-${user.id}` : `onboarding-${user.id}`,
        selectBy: {
          last: 50, // Get last 50 messages
        },
      });

      // Transform the messages to match our frontend interface
      const messages = uiMessages.map((msg) => ({
        id: msg.id,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      return Response.json({ messages });
    } catch (error: any) {
      // If thread doesn't exist yet (user hasn't sent any messages), return empty array
      if (error.message?.includes('No thread found')) {
        return Response.json({ messages: [] });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
