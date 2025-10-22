import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Get user health research query
const getUserQueryStep = createStep({
  id: 'get-user-query',
  inputSchema: z.object({}),
  outputSchema: z.object({
    query: z.string(),
    userContext: z.object({
      goals: z.array(z.string()).optional(),
      currentHabits: z.array(z.string()).optional(),
      preferences: z.any().optional(),
    }),
  }),
  resumeSchema: z.object({
    query: z.string(),
    userContext: z.object({
      goals: z.array(z.string()).optional(),
      currentHabits: z.array(z.string()).optional(),
      preferences: z.any().optional(),
    }),
  }),
  suspendSchema: z.object({
    message: z.object({
      query: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend, mastra }) => {
    if (resumeData) {
      return {
        ...resumeData,
        query: resumeData.query || '',
      };
    }

    // Get user context from the health wellness agent's memory
    const agent = mastra.getAgent('longevityCoachAgent');
    
    await suspend({
      message: {
        query: 'What health or wellness topic would you like me to research for your personalized plan? For example: "best exercises for weight loss" or "nutrition for muscle building"',
      },
    });

    return {
      query: '',
      userContext: {
        goals: [],
        currentHabits: [],
        preferences: {},
      },
    };
  },
});

// Step 2: Research
const researchStep = createStep({
  id: 'research',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { query } = inputData;

    try {
      const agent = mastra.getAgent('researchAgent');
      const researchPrompt = `Research the following health and wellness topic thoroughly using the two-phase process: "${query}".

      Focus on evidence-based health information, safety considerations, and practical implementation.
      Phase 1: Search for 2-3 initial queries about this health topic
      Phase 2: Search for follow-up questions from the learnings (then STOP)

      Return findings in JSON format with queries, searchResults, learnings, completedQueries, phase, sourceCredibility, and safetyNotes.`;

      const result = await agent.generate(
        [
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        {
          maxSteps: 15,
        },
      );

      // Create a summary
      const summary = `Research completed on "${query}:" \n\n ${JSON.stringify(result.object, null, 2)}\n\n`;

      return {
        researchData: result.object,
        summary,
      };
    } catch (error: any) {
      console.log({ error });
      return {
        researchData: { error: error.message },
        summary: `Error: ${error.message}`,
      };
    }
  },
});

// Step 3: Get user approval
const approvalStep = createStep({
  id: 'approval',
  inputSchema: z.object({
    researchData: z.any(),
    summary: z.string(),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        researchData: inputData.researchData,
      };
    }

    await suspend({
      summary: inputData.summary,
      message: `Is this research sufficient? [y/n] `,
    });

    return {
      approved: false,
      researchData: inputData.researchData,
    };
  },
});

// Define the workflow
export const researchWorkflow = createWorkflow({
  id: 'research-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  steps: [getUserQueryStep, researchStep, approvalStep],
});

researchWorkflow.then(getUserQueryStep).then(researchStep).then(approvalStep).commit();
