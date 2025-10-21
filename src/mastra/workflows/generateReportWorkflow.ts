import { createStep, createWorkflow } from '@mastra/core/workflows';
import { researchWorkflow } from './researchWorkflow';
import { z } from 'zod';

// Map research output to wellness plan input and handle conditional logic
const processResearchResultStep = createStep({
  id: 'process-research-result',
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: z.any(),
  }),
  outputSchema: z.object({
    wellnessPlan: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    // First determine if research was approved/successful
    const approved = inputData.approved && !!inputData.researchData;

    if (!approved) {
      console.log('Research not approved or incomplete, ending workflow');
      return { completed: false };
    }

    // If approved, generate wellness plan
    try {
      console.log('Generating wellness plan...');
      const agent = mastra.getAgent('reportAgent'); // This is now the Wellness Plan Generator
      const response = await agent.generate([
        {
          role: 'user',
          content: `Generate a personalized wellness plan based on this health research: ${JSON.stringify(inputData.researchData)}. 

Create a comprehensive plan that includes:
- Executive summary with key objectives
- Detailed routines (exercise, nutrition, lifestyle)
- Implementation timeline and milestones
- Safety considerations and contraindications
- Progress tracking recommendations
- Modification guidelines

Focus on creating practical, evidence-based recommendations that are safe and sustainable.`,
        },
      ]);

      console.log('Wellness plan generated successfully!');
      return { wellnessPlan: response.text, completed: true };
    } catch (error) {
      console.error('Error generating wellness plan:', error);
      return { completed: false };
    }
  },
});

// Create the wellness plan generation workflow that iteratively researches and generates plans
export const generateReportWorkflow = createWorkflow({
  id: 'generate-wellness-plan-workflow',
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({}),
  outputSchema: z.object({
    wellnessPlan: z.string().optional(),
    completed: z.boolean(),
  }),
});

// The workflow logic:
// 1. Run researchWorkflow iteratively until approved
// 2. Process results and generate report if approved
generateReportWorkflow
  .dowhile(researchWorkflow, async ({ inputData }) => {
    const isCompleted = inputData.approved;
    return isCompleted !== true;
  })
  .then(processResearchResultStep)
  .commit();
