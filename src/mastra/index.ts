import { Mastra } from '@mastra/core';
import { postgresStore } from './storage';
import { researchWorkflow } from './workflows/researchWorkflow';
import { learningExtractionAgent } from './agents/learningExtractionAgent';
import { evaluationAgent } from './agents/evaluationAgent';
import { reportAgent } from './agents/reportAgent';
import { researchAgent } from './agents/researchAgent';
import { webSummarizationAgent } from './agents/webSummarizationAgent';
import { longevityCoachAgent } from './agents/longevityCoachAgent';
import { dataLoggerAgent } from './agents/dataLoggerAgent';
import { guestOnboardingAgent } from './agents/guestOnboardingAgent';
import { generateReportWorkflow } from './workflows/generateReportWorkflow';
import { healthDataCollectionWorkflow } from './workflows/healthDataCollectionWorkflow';

// Mastra instance without storage for guest onboarding
export const mastra = new Mastra({
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    longevityCoachAgent,
    dataLoggerAgent,
    guestOnboardingAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow, healthDataCollectionWorkflow },
  telemetry: {
    enabled: false,
  },
});

// Helper function to create user-specific Mastra instance
export function createUserMastra(userId: string) {
  return new Mastra({
    storage: postgresStore,
    agents: {
      researchAgent,
      reportAgent,
      evaluationAgent,
      learningExtractionAgent,
      webSummarizationAgent,
      longevityCoachAgent,
      dataLoggerAgent,
      guestOnboardingAgent,
    },
    workflows: { generateReportWorkflow, researchWorkflow, healthDataCollectionWorkflow },
    telemetry: {
      enabled: false,
    },
  });
}
