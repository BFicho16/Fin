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

console.log('[MASTRA] About to create main mastra instance (with storage)');
// Main Mastra instance with storage for authenticated users
export const mastra = new Mastra({
  storage: postgresStore,
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    longevityCoachAgent,
    dataLoggerAgent,
  },
  workflows: { generateReportWorkflow, researchWorkflow, healthDataCollectionWorkflow },
  telemetry: {
    enabled: false,
  },
});

console.log('[MASTRA] About to create guestMastra instance (no storage)');
// Guest onboarding instance without storage (uses Supabase directly)
export const guestMastra = new Mastra({
  agents: {
    guestOnboardingAgent,
  },
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
