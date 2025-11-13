import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const validTabs = ['my-routine', 'activity-log', 'profile'] as const;

export const navigateToTabTool = createTool({
  id: 'navigate-to-tab',
  description: 'Navigate to a specific feature tab in the main app. Available tabs: my-routine, activity-log, profile',
  inputSchema: z.object({
    tab: z.enum(validTabs).describe('The tab to navigate to'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    activeTab: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { tab } = context;
    
    // Validate tab name
    if (!validTabs.includes(tab as any)) {
      throw new Error(`Invalid tab name: ${tab}. Valid options are: ${validTabs.join(', ')}`);
    }

    // Note: This tool will need to update the React context state
    // The actual implementation may require an API endpoint that the frontend polls,
    // or a different mechanism depending on how Mastra tools can interact with React state
    // For now, this is a placeholder that returns success
    
    // TODO: Implement actual navigation via API endpoint or context update mechanism
    // This could be done by:
    // 1. Creating an API endpoint that stores the desired tab in a session/cache
    // 2. Frontend polling or using websockets to detect the change
    // 3. Or using a different pattern if Mastra provides direct React context access
    
    return {
      success: true,
      message: `Navigation requested to ${tab} tab`,
      activeTab: tab,
    };
  },
});

