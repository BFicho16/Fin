import { Mastra } from '@mastra/core';
import { postgresStore } from './storage';
import { guestOnboardingAgent } from './agents/guest-onboarding-agent';
import { longevityCoachAgent } from './agents/longevity-coach-agent';

console.log('[MASTRA] About to create main mastra instance (with storage)');
// Main Mastra instance with storage for authenticated users
export const mastra = new Mastra({
  storage: postgresStore,
  agents: {
    longevityCoachAgent,
  },
  workflows: {},
  telemetry: {
    enabled: false,
  },
});

console.log('[MASTRA] About to create guestMastra instance (with storage)');
// Guest onboarding instance with storage for conversation memory
export const guestMastra = new Mastra({
  storage: postgresStore,
  agents: {
    guestOnboardingAgent,
  },
  telemetry: {
    enabled: false,
  },
});
