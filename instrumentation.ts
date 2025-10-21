// Suppress Mastra telemetry warnings
// This file is required to suppress the deprecated telemetry warnings
// See: https://mastra.ai/en/docs/observability/tracing#tracing-outside-mastra-server-environment

// Set the global variable to suppress telemetry warnings
(globalThis as any).___MASTRA_TELEMETRY___ = true;

// Disable AI Tracing to prevent "already registered" errors
(globalThis as any).___MASTRA_AI_TRACING___ = false;

// Disable all observability features
(globalThis as any).___MASTRA_OBSERVABILITY___ = false;

export function register() {
  // This function is called by Next.js instrumentation hook
  // No additional setup needed for basic telemetry suppression
}
