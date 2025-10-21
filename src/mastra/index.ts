import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { healthWellnessAgent } from './agents/healthWellnessAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
import { healthDataCollectionWorkflow } from './workflows/healthDataCollectionWorkflow';

// For serverless deployment, use in-memory storage or remove storage entirely
// LibSQLStore with file URLs doesn't work in serverless environments
export const mastra = new Mastra({
  // Remove storage for serverless deployment
  // storage: new LibSQLStore({
  //   url: 'file:../mastra.db',
  // }),
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    healthWellnessAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow, healthDataCollectionWorkflow },
  telemetry: {
    enabled: false,
  },
});

// Helper function to create user-specific Mastra instance
export function createUserMastra(userId: string) {
  return new Mastra({
    // Remove storage for serverless deployment
    // storage: new LibSQLStore({
    //   url: `file:../mastra_${userId}.db`, // User-specific database
    // }),
    agents: {
      researchAgent,
      reportAgent,
      evaluationAgent,
      learningExtractionAgent,
      webSummarizationAgent,
      healthWellnessAgent,
    },
    workflows: { generateReportWorkflow, researchWorkflow, healthDataCollectionWorkflow },
    telemetry: {
      enabled: false,
    },
  });
}
