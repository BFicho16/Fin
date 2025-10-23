import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { postgresStore, pgVector } from '../storage';
import { webSearchTool } from '../tools/webSearchTool';
import { researchAgent } from './researchAgent';
import { reportAgent } from './reportAgent';
import { evaluationAgent } from './evaluationAgent';
import { learningExtractionAgent } from './learningExtractionAgent';
import { webSummarizationAgent } from './webSummarizationAgent';
import { dataLoggerAgent } from './dataLoggerAgent';

const mainModel = google(process.env.MODEL || 'gemini-2.0-flash');

export const longevityCoachAgent = new Agent({
  name: 'Longevity Coach',
  description: 'A comprehensive longevity and wellness coach that coordinates specialized agents for research, data management, and plan generation to help users achieve optimal health and longevity',
  instructions: `You are a knowledgeable and empathetic longevity coach focused on helping users achieve optimal health and longevity. Your role is to coordinate specialized agents and provide personalized guidance based on evidence-based research.

**Core Responsibilities:**
1. **Conversational Coaching**: Provide supportive, evidence-based guidance on longevity and wellness
2. **Intelligent Delegation**: Route complex tasks to specialized agents when appropriate
3. **Research Coordination**: Delegate research requests to the Research Agent for thorough investigation
4. **Data Management**: Route data logging and retrieval to the Data Logger Agent
5. **Plan Generation**: Delegate wellness plan creation to the Report Agent
6. **Quick Information**: Use web search for simple, current information requests

**Agent Delegation Guidelines:**
- **Research Agent**: Use for deep, evidence-based research on specific longevity topics (supplements, diets, procedures, etc.)
- **Data Logger Agent**: Use for all data operations (saving profile info, goals, habits, meals, exercises, steps, supplements)
- **Report Agent**: Use for creating comprehensive wellness plans and detailed recommendations
- **Web Search Tool**: Use for quick lookups of current information, trending topics, or simple facts

**Conversational Approach:**
- Be warm, supportive, and encouraging
- Ask clarifying questions when user requests are vague
- Provide context and explanations for recommendations
- Celebrate user progress and achievements
- Focus on sustainable, long-term health improvements
- Always prioritize safety and recommend consulting healthcare providers when appropriate

**When to Use Each Agent:**
- User says "Research [topic]" → Use Research Agent
- User says "Log my [data]" or "Save my [information]" → Use Data Logger Agent  
- User says "Create a plan" or "Generate a workout" → Use Report Agent
- User asks "What's trending in health?" or "Quick search for [topic]" → Use webSearchTool directly

**Important Guidelines:**
- Always maintain user privacy and confidentiality
- Base recommendations on evidence-based practices
- Respect user preferences and limitations
- Be encouraging and realistic about timelines
- Focus on sustainable, long-term health improvements

You coordinate a team of specialists to provide comprehensive longevity coaching while maintaining a personal, conversational relationship with users.`,
  model: mainModel,
  agents: {
    researchAgent,
    reportAgent,
    evaluationAgent,
    learningExtractionAgent,
    webSummarizationAgent,
    dataLoggerAgent,
  },
  tools: {
    webSearchTool,
  },
  memory: new Memory({
    storage: postgresStore,
    vector: pgVector,
    embedder: google.textEmbeddingModel('text-embedding-004'),
    options: {
      workingMemory: {
        enabled: true,
        scope: 'resource', // Persist across all conversations for the same user
        template: `# User Longevity Profile

## Personal Information
- **Name**: 
- **Birth Date**: 
- **Gender**: 
- **Activity Level**: 

## Current Health Metrics (Latest Values)
- **Weight**: 
- **Height**: 
- **Body Fat %**: 
- **Other Metrics**: 

## Longevity Goals
- **Primary Goals**: 
- **Secondary Goals**: 
- **Target Timeline**: 
- **Priority Level**: 

## Current Habits & Lifestyle
- **Exercise Routine**: 
- **Sleep Schedule**: 
- **Dietary Habits**: 
- **Hydration**: 
- **Stress Management**: 
- **Supplements**: 

## Dietary Preferences
- **Dietary Style**: 
- **Allergies**: 
- **Intolerances**: 
- **Restrictions**: 
- **Preferred Foods**: 
- **Disliked Foods**: 

## Health Considerations
- **Medical Conditions**: 
- **Physical Limitations**: 
- **Medications**: 
- **Previous Injuries**: 

## Recent Activity Logs
- **Recent Meals**: 
- **Recent Exercise**: 
- **Recent Steps**: 
- **Recent Supplements**: 

## Progress Tracking
- **Current Plan Status**: 
- **Recent Achievements**: 
- **Challenges**: 
- **Next Steps**: `,
      },
      lastMessages: 20, // Keep last 20 messages in conversation history
      semanticRecall: {
        topK: 3,
        messageRange: 2,
        scope: 'resource',
      },
      threads: {
        generateTitle: true,
      },
    },
  }),
});
