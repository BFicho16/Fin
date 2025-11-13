# Mastra.AI Guide: How to Use Agents, Tools, and Workflows

This guide explains, in plain English, how to correctly use Mastra.AI agents, tools, and workflows in your application. It's based on official Mastra documentation and real-world patterns from this codebase.

## Table of Contents

1. [What is Mastra.AI?](#what-is-mastraai)
2. [Setting Up Mastra](#setting-up-mastra)
3. [Creating Agents](#creating-agents)
4. [The Longevity Coach Agent](#the-longevity-coach-agent)
5. [Creating Tools](#creating-tools)
6. [Agent Context & Page Awareness](#agent-context--page-awareness)
7. [Using Memory](#using-memory)
8. [Building Workflows](#building-workflows)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## What is Mastra.AI?

Mastra.AI is a framework for building AI-powered applications. Think of it as a toolkit that helps you:

- **Agents**: AI assistants that can have conversations, make decisions, and use tools
- **Tools**: Functions that agents can call to perform specific tasks (like fetching data, saving to a database, etc.)
- **Workflows**: Multi-step processes that combine agents and tools to accomplish complex tasks
- **Memory**: The ability for agents to remember previous conversations and context

Think of an agent as a smart assistant, tools as the things it can do (like a calculator or database), and workflows as a recipe that combines multiple steps to achieve a goal.

---

## Setting Up Mastra

### Installation

First, install the core Mastra package:

```bash
npm install @mastra/core
```

You'll also need packages for storage (to enable memory) and any AI model providers you want to use:

```bash
# For memory/storage (using PostgreSQL in this project)
npm install @mastra/memory @mastra/pg

# For AI models (using Google Gemini in this project)
npm install @ai-sdk/google
```

### Environment Variables

Set up your API keys in a `.env` file:

```bash
# For Google Gemini (used in this project)
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
MODEL="gemini-2.5-flash-lite"

# For OpenAI (alternative)
OPENAI_API_KEY="your-api-key"

# Database connection (for storage/memory)
DATABASE_URL="your-postgres-connection-string"
```

### Creating the Main Mastra Instance

Create a main Mastra instance that will hold all your agents and storage. This is typically done in `src/mastra/index.ts`:

```typescript
import { Mastra } from '@mastra/core';
import { postgresStore } from './storage';
import { longevityCoachAgent } from './agents/longevity-coach-agent';
import { guestOnboardingAgent } from './agents/guest-onboarding-agent';

// Main instance for authenticated users
export const mastra = new Mastra({
  storage: postgresStore,  // Required for memory
  agents: {
    longevityCoachAgent,  // Primary agent for authenticated users
  },
  workflows: {},
  telemetry: {
    enabled: false,  // Set to true for production monitoring
  },
});

// Separate instance for guest users
export const guestMastra = new Mastra({
  storage: postgresStore,
  agents: {
    guestOnboardingAgent,  // Agent for guest onboarding
  },
  telemetry: {
    enabled: false,
  },
});
```

**Key Points:**
- The `storage` option enables memory across all agents
- `mastra` instance is for authenticated users (uses `longevityCoachAgent`)
- `guestMastra` instance is for guest users (uses `guestOnboardingAgent`)
- All agents must be registered in the `agents` object
- Use the appropriate instance throughout your application

---

## Creating Agents

An agent is an AI assistant that can have conversations, use tools, and make decisions. Think of it as a specialized worker with a specific role.

### Basic Agent Structure

```typescript
import { Agent } from '@mastra/core/agent';
import { google } from '@ai-sdk/google';

const model = google(process.env.MODEL || 'gemini-2.5-flash-lite');

export const myAgent = new Agent({
  name: 'My Agent',  // A descriptive name
  instructions: `You are a helpful assistant that...`,  // What the agent does
  model: model,  // The AI model to use
  tools: {
    // Tools go here (we'll cover this next)
  },
  memory: new Memory({
    // Memory configuration (we'll cover this next)
  }),
});
```

### Writing Good Instructions

Instructions tell the agent how to behave. Be specific and clear, but focus on behavior and personality, NOT on tool usage.

**Good Example:**
```typescript
instructions: `You are a specialized onboarding agent for guest users. 
Your mission is to collect their bedtime and wake-up routines through a 
warm, supportive conversation. Always confirm data before saving it.`
```

**Bad Example:**
```typescript
instructions: `You are helpful.`  // Too vague!
```

**Also Bad - Don't Explain Tools in Instructions:**
```typescript
instructions: `Use getActiveRoutineTool to see their current active routine.
Use createDraftRoutineTool to start a new draft...`  // ❌ Don't do this!
```

**Why?** Tool descriptions already explain when and how to use tools. Explaining them in instructions:
- Duplicates information (maintenance burden)
- Increases token costs
- Makes instructions harder to maintain as you add more tools
- The framework automatically shows tools to the agent based on their descriptions

**Instead:** Write clear tool descriptions and let the framework handle tool discovery.

### Real Example from This Codebase

Looking at `src/mastra/agents/guestOnboardingAgent.ts`:

```typescript
export const guestOnboardingAgent = new Agent({
  name: 'Guest Onboarding Agent',
  instructions: `You are a specialized onboarding agent...`,  // Detailed instructions
  model: mainModel,
  tools: {
    getGuestDataTool,
    updateGuestDataTool,
    checkGuestOnboardingProgressTool,
    deleteGuestRoutineItemTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 20  // Remember last 20 messages
    }
  })
});
```

### Using an Agent

Once registered in your Mastra instance, you can use an agent like this:

```typescript
import { mastra } from './mastra';

// For authenticated users - use longevity coach agent
const agent = mastra.getAgent('longevityCoachAgent');

// Generate a response
const response = await agent.generate('How can I improve my sleep?', {
  memory: {
    thread: `longevity-coach-${user.id}`,      // Conversation thread ID
    resource: `longevity-coach-${user.id}`,   // User identifier
  },
  runtimeContext,
});
```

**Key Points:**
- Always use `mastra.getAgent()` to get a registered agent
- For authenticated users, use `longevityCoachAgent`
- For guest users, use `guestOnboardingAgent` from `guestMastra`
- Use `memory.thread` and `memory.resource` with consistent IDs per user
- The agent will automatically use its tools when needed

---

## The Longevity Coach Agent

The **Longevity Coach Agent** (`longevityCoachAgent`) is the primary agent that authenticated users interact with in this application. It serves as a personal health and wellness coach that learns about users over time and provides personalized recommendations.

### Overview

The longevity coach agent is designed to:
- Build a deep understanding of each user through natural conversation
- Remember entire conversation history across all interactions
- Maintain structured user information (profile, health metrics, goals, preferences)
- Provide evidence-based, personalized longevity and health recommendations
- Reference past conversations to show continuity and build rapport

### Memory Configuration

The longevity coach uses advanced memory features to maintain context and learn about users:

```typescript
memory: new Memory({
  storage: postgresStore,
  vector: pgVector,
  embedder: 'google/text-embedding-004',
  options: {
    lastMessages: false,  // Access entire conversation history
    semanticRecall: {
      topK: 5,
      messageRange: 3,
      scope: 'resource',  // Search across all threads for this user
    },
    workingMemory: {
      enabled: true,
      scope: 'resource',  // Persist across all conversations
      template: `# User Profile
## Personal Information
- Age/Birth Date: [if shared]
...
`,
    },
  },
})
```

**Key Memory Features:**

1. **Full Conversation History** (`lastMessages: false`):
   - The agent can access the entire conversation history, not just recent messages
   - This allows it to reference any past conversation naturally

2. **Semantic Recall** (`semanticRecall`):
   - Uses vector search to find semantically similar messages from past conversations
   - When a user asks about a topic, it can find relevant past discussions even if they were weeks ago
   - `topK: 5` retrieves the 5 most relevant past messages
   - `messageRange: 3` includes 3 messages before and after each match for context
   - `scope: 'resource'` searches across all conversation threads for the same user

3. **Working Memory** (`workingMemory`):
   - Maintains structured information about the user in a Markdown template
   - Automatically extracts and updates user information from conversations
   - `scope: 'resource'` means this information persists across all conversations
   - Stores: profile info, health metrics, goals, preferences, current routines, challenges

### How It Works

**Thread and Resource IDs:**
- **Thread ID**: `longevity-coach-${user.id}` (single thread per user for continuity)
- **Resource ID**: `longevity-coach-${user.id}` (same as thread)

This means all conversations with a user happen in one continuous thread, allowing the agent to build a comprehensive understanding over time.

**Memory Flow:**
1. User sends a message → stored in `mastra_messages` table
2. Semantic recall searches for relevant past messages → finds related conversations
3. Working memory is updated → extracts new user information
4. Agent responds with full context → references past conversations and user info

**Example Interaction:**
```
User: "I've been sleeping better since we talked about my bedtime routine"
Agent: "That's great to hear! I remember we discussed moving your bedtime to 10 PM and adding a reading routine. How many hours of sleep are you getting now?"
```

The agent can reference past conversations because:
- Semantic recall found the previous conversation about bedtime routines
- Working memory contains the user's sleep schedule information
- Full conversation history provides context

### Building Tools for the Longevity Coach

When building tools for the longevity coach agent, follow these patterns. See `src/mastra/tools/routine-tools.ts` for a complete real-world example.

#### 1. Access User ID from Runtime Context

All authenticated user tools should get the user ID from runtime context:

```typescript
export const getUserRoutineTool = createTool({
  id: 'get-user-routine',
  description: 'Get the user\'s active routine',
  inputSchema: z.object({}),
  outputSchema: z.object({
    routine: z.any(),
  }),
  execute: async ({ runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }
    
    // Use userId to query database
    const supabase = runtimeContext?.get('supabase');
    // ... query user_routines table
  },
});
```

**Key Points:**
- Always get `userId` from `runtimeContext.get('userId')`
- The Supabase client is also available via `runtimeContext.get('supabase')`
- Throw clear errors if required context is missing

#### 2. Tool Naming Convention

Follow the `[action][noun]Tool` pattern:

- `getActiveRoutineTool` - retrieves active routine
- `getDraftRoutineTool` - retrieves draft routine
- `createDraftRoutineTool` - creates or updates draft routine
- `updateDraftRoutineTool` - updates existing draft routine
- `activateDraftRoutineTool` - activates draft routine

#### 3. Writing Self-Contained Tool Descriptions

**CRITICAL**: Tool descriptions must be self-contained and complete. The agent uses these descriptions to understand when and how to use tools. Do NOT explain tools in agent instructions - let the descriptions do the work.

**Good Tool Description Example:**
```typescript
export const createDraftRoutineTool = createTool({
  id: 'create-draft-routine',
  description: 'Create a new draft routine for the user, or update an existing draft if one already exists. Use this when the user wants to create a new routine or update their existing routine. The draft will be displayed in real-time in the user\'s "My Routine" tab. The content should be in Markdown format. Only one draft exists at a time per user.',
  // ...
});
```

**What Makes a Good Description:**
- Explains what the tool does
- Explains when to use it (use cases)
- Explains any important constraints or behaviors
- Mentions user-facing effects (e.g., "displayed in real-time")
- References related tools if needed (e.g., "if no draft exists, use createDraftRoutineTool instead")

#### 4. Complete Tool Example: Routine Management

Here's a complete example from `src/mastra/tools/routine-tools.ts` showing a full tool implementation:

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const getActiveRoutineTool = createTool({
  id: 'get-active-routine',
  description: 'Get the user\'s currently active routine. Use this to understand what routine the user currently has active, or to check if they have an active routine at all.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    routine: z.object({
      id: z.string(),
      content: z.string(),
      version: z.number(),
      created_at: z.string(),
    }).nullable(),
  }),
  execute: async ({ runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }

    const supabase = runtimeContext?.get('supabase');
    if (!supabase) {
      throw new Error('Supabase client not found in runtime context');
    }

    const { data: routine, error } = await supabase
      .from('user_routines')
      .select('id, content, version, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    if (error) {
      // If no rows found, return null (not an error)
      if (error.code === 'PGRST116') {
        return { routine: null };
      }
      throw new Error(`Failed to fetch active routine: ${error.message}`);
    }

    return { routine };
  },
});
```

**Key Patterns from This Example:**
- Clear, self-contained description
- Proper error handling (distinguish between "not found" and actual errors)
- Use runtime context for user-specific data
- Return null for "not found" cases (not an error)
- Validate required context before proceeding

#### 5. Handling Draft/Active State Logic

When building tools that manage state (like drafts vs active), handle the logic in the tool:

```typescript
export const createDraftRoutineTool = createTool({
  id: 'create-draft-routine',
  description: 'Create a new draft routine for the user, or update an existing draft if one already exists...',
  execute: async ({ context, runtimeContext }) => {
    // ... get userId and supabase ...
    
    // Check if a draft already exists
    const { data: existingDraft } = await supabase
      .from('user_routines')
      .select('id, version')
      .eq('user_id', userId)
      .eq('is_active', false)
      .is('deleted_at', null)
      .single();

    if (existingDraft) {
      // Update existing draft
      // ...
    } else {
      // Create new draft with next version number
      // ...
    }
  },
});
```

#### 6. Registering Tools with the Agent

To add tools to the longevity coach agent, update `src/mastra/agents/longevity-coach-agent.ts`:

```typescript
import {
  getActiveRoutineTool,
  getDraftRoutineTool,
  createDraftRoutineTool,
  updateDraftRoutineTool,
  activateDraftRoutineTool,
} from '../tools/routine-tools';

export const longevityCoachAgent = new Agent({
  name: 'Longevity Coach Agent',
  instructions: `...`, // Focus on behavior, NOT tool usage
  model: mainModel,
  tools: {
    getActiveRoutineTool,
    getDraftRoutineTool,
    createDraftRoutineTool,
    updateDraftRoutineTool,
    activateDraftRoutineTool,
  },
  memory: new Memory({ ... }),
});
```

**Important**: Do NOT explain tool usage in agent instructions. The tool descriptions handle that. Instructions should focus on the agent's personality, behavior, and high-level capabilities.

### Best Practices for Longevity Coach Tools

1. **Self-Contained Descriptions**: Write complete, self-contained tool descriptions that explain what, when, and why
2. **User-Centric**: Tools should help the agent understand and help the user
3. **Context-Aware**: Tools should use runtime context to access user-specific data
4. **Error Handling**: Always handle errors gracefully and distinguish between "not found" and actual errors
5. **State Management**: Handle draft/active state logic within tools, not in agent instructions
6. **Scalable**: As you add more tools, keep descriptions in tool definitions, not in agent instructions

---

## Creating Tools

Tools are functions that agents can call to perform specific tasks. Think of them as the agent's "hands" - they let the agent interact with the world (databases, APIs, calculations, etc.).

### Basic Tool Structure

```typescript
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const myTool = createTool({
  id: 'my-tool',  // Unique identifier
  description: 'What this tool does in plain English',  // Agent uses this to decide when to call it
  inputSchema: z.object({
    // Define what inputs the tool expects
    name: z.string().describe('The name of the thing'),
    age: z.number().optional(),
  }),
  outputSchema: z.object({
    // Define what the tool returns
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    // The actual function that runs
    const { name, age } = context;
    
    // Do something useful here
    return {
      success: true,
      message: `Hello ${name}!`,
    };
  },
});
```

### Understanding Tool Parameters

- **`context`**: Contains the input data passed to the tool (matches `inputSchema`)
- **`runtimeContext`**: Contains request-specific data (like user IDs, session IDs, page context, etc.)

### Tool Naming Convention

All Mastra tools follow the naming pattern: `[action][noun]Tool`

Examples:
- `getUserRoutineTool` - gets user routine (for longevity coach)
- `updateUserProfileTool` - updates user profile (for longevity coach)
- `getGuestDataTool` - gets guest data (for guest onboarding)
- `updateGuestDataTool` - updates guest data (for guest onboarding)

**Reference**: 
- For longevity coach tools: See "Building Tools for the Longevity Coach" section above
- For guest onboarding tools: See `src/mastra/tools/guestOnboardingTools.ts`

### Best Practices for Tools

1. **Self-Contained Descriptions**: Write complete tool descriptions that explain:
   - What the tool does
   - When to use it (use cases)
   - Important constraints or behaviors
   - User-facing effects (e.g., "displayed in real-time")
   - Relationships to other tools (e.g., "if no draft exists, use createDraftRoutineTool instead")
   
   The agent reads these descriptions to understand tools - they must be complete and self-contained.

2. **Good Schemas**: Use Zod schemas with `.describe()` to help the agent understand inputs

3. **Error Handling**: Always handle errors gracefully:
   - Distinguish between "not found" (return null) and actual errors (throw)
   - Provide meaningful error messages
   - Handle database-specific error codes (e.g., `PGRST116` for "no rows")

4. **Runtime Context**: Use `runtimeContext` to access user/session data, not hardcoded values

5. **Naming Convention**: Follow `[action][noun]Tool` pattern (e.g., `getActiveRoutineTool`, `createDraftRoutineTool`)

6. **Scalability**: As you add more tools (20+), keep all tool logic in tool descriptions, not in agent instructions

**Note**: For building tools for the longevity coach agent, see the detailed guide in "Building Tools for the Longevity Coach" section above. See `src/mastra/tools/routine-tools.ts` for complete real-world examples.

---

## Agent Context & Page Awareness

Agents automatically receive information about the current page and active tab through the `currentPage` object in their runtime context.

### Current Page Context Structure

```typescript
{
  currentPage: {
    route: string;        // e.g., "/"
    title: string;       // e.g., "Home"
    link: string;        // e.g., "/"
    metadata?: {
      activeTab?: string;  // e.g., "my-routine", "activity-log", "profile"
    }
  }
}
```

### How Context Flows to Agents

1. **PageOverlayProvider** (`src/components/page-overlay.tsx`):
   - Tracks `activeTab` state
   - Includes `activeTab` in `currentPage.metadata` when on root route (`/`)

2. **Chat Interface** (`src/components/chat/authenticated-chat-interface.tsx`):
   - Reads `activeTab` from `usePageOverlay()` hook
   - Includes it in `currentPage.metadata` when building message payload

3. **API Route** (`src/app/api/chat/route.ts`):
   - Receives `currentPage` in request body
   - Sets it in agent's `runtimeContext` via `runtimeContext.set('currentPage', currentPage)`

4. **Agent Runtime**:
   - Agent can access `currentPage` from runtime context
   - Can read `currentPage.metadata.activeTab` to know which tab is visible

### Using Context in Agents

When creating agents, you can access the current page context:

```typescript
// In tool execution or agent logic:
// The runtimeContext will contain currentPage if it was set
const currentPage = runtimeContext?.get('currentPage');
const activeTab = currentPage?.metadata?.activeTab;
```

**Reference**: See `src/components/page-overlay.tsx` and `src/app/api/chat/route.ts` for implementation details

---

## Using Memory

Memory allows agents to remember previous conversations and maintain context across multiple interactions.

### Why Memory Matters

Without memory, each agent call is independent - the agent forgets everything from previous conversations. With memory, agents can:
- Reference earlier parts of the conversation
- Remember user preferences
- Build context over time
- Provide more personalized responses

### Setting Up Memory

**Step 1: Install Memory Package**

```bash
npm install @mastra/memory
```

**Step 2: Configure Storage**

Memory needs storage to persist conversations. In this project, we use PostgreSQL:

```typescript
import { PostgresStore } from '@mastra/pg';

export const postgresStore = new PostgresStore({
  connectionString: process.env.DATABASE_URL!,
});
```

**Step 3: Add Storage to Mastra Instance**

```typescript
export const mastra = new Mastra({
  storage: postgresStore,  // This enables memory for all agents
  agents: { ... },
});
```

**Step 4: Configure Memory on Agent**

```typescript
import { Memory } from '@mastra/memory';

export const myAgent = new Agent({
  name: 'My Agent',
  instructions: '...',
  model: model,
  memory: new Memory({
    options: {
      lastMessages: 20,  // Remember last 20 messages
    },
  }),
});
```

### Using Memory in Agent Calls

When calling an agent, provide memory context:

```typescript
// For longevity coach agent (authenticated users)
const response = await agent.generate('What did we discuss last week?', {
  memory: {
    thread: `longevity-coach-${user.id}`,    // Single thread per user
    resource: `longevity-coach-${user.id}`,  // Same as thread
  },
  runtimeContext,
});

// For guest onboarding agent
const response = await guestAgent.generate('What time do you go to bed?', {
  memory: {
    thread: `guest-session-${sessionId}`,    // Session-specific thread
    resource: `guest-session-${sessionId}`,  // Session identifier
  },
});
```

**Understanding Thread vs Resource:**
- **`thread`**: A specific conversation or session
  - For longevity coach: `longevity-coach-${user.id}` (single thread per user)
  - For guest onboarding: `guest-session-${sessionId}` (per session)
- **`resource`**: A stable identifier for the user or entity
  - For longevity coach: `longevity-coach-${user.id}` (same as thread)
  - For guest onboarding: `guest-session-${sessionId}` (same as thread)

Use the same `thread` and `resource` values to maintain context across multiple calls.

### Memory Options

The longevity coach agent uses advanced memory configuration (see "The Longevity Coach Agent" section above). For simpler agents like guest onboarding:

```typescript
memory: new Memory({
  options: {
    lastMessages: 20,        // Keep last N messages in context
    // Other options available for semantic recall, working memory, etc.
  },
}),
```

---

## Building Workflows

Workflows are multi-step processes that combine agents and tools to accomplish complex tasks. Think of them as recipes that orchestrate multiple operations.

**Note**: Workflows are not currently used in this codebase. The longevity coach agent handles all user interactions through natural conversation, and the guest onboarding agent uses a simple conversational flow. If you need to build workflows in the future, refer to the [Mastra Workflows Documentation](https://mastra.ai/docs/workflows).

---

## Best Practices

### 1. Agent Instructions

- **Be Specific**: Clearly define the agent's role and constraints
- **Set Boundaries**: Tell the agent what NOT to do
- **Provide Examples**: Include examples of good responses
- **Focus on Behavior**: Instructions should focus on personality, tone, and behavior - NOT tool usage
- **Don't Explain Tools**: Tool descriptions handle that - don't duplicate in instructions
- **Update Regularly**: Refine instructions based on agent behavior

### 2. Tool Design

- **Single Responsibility**: Each tool should do one thing well
- **Self-Contained Descriptions**: Write complete descriptions that explain what, when, and why - the agent uses these to understand tools
- **Scalable**: As you add more tools, keep descriptions in tool definitions, not in agent instructions
- **Validate Inputs**: Use Zod schemas to validate all inputs
- **Handle Errors**: Always provide meaningful error messages and distinguish between "not found" and actual errors

### 3. Memory Management

- **Use Consistent IDs**: Always use the same `thread` and `resource` for related conversations
  - Longevity coach: `longevity-coach-${user.id}` for both thread and resource
  - Guest onboarding: `guest-session-${sessionId}` for both thread and resource
- **Longevity Coach Memory**: Uses full conversation history, semantic recall, and working memory (see "The Longevity Coach Agent" section)
- **Guest Onboarding Memory**: Uses limited recent messages (`lastMessages: 20`)

### 5. Code Organization

- **Separate Files**: Keep agents, tools, and workflows in separate files
- **Consistent Naming**: Use clear, descriptive names
- **Documentation**: Add comments explaining complex logic
- **Type Safety**: Use TypeScript and Zod schemas for type safety

---

## Common Patterns

### Pattern 1: Longevity Coach Agent with Database Tool

This is the primary pattern used in this codebase. See "Building Tools for the Longevity Coach" section above for complete examples.

```typescript
// Tool: Get user routine
export const getUserRoutineTool = createTool({
  id: 'get-user-routine',
  description: 'Get the user\'s active routine from the database',
  inputSchema: z.object({}),
  outputSchema: z.object({
    routine: z.any().nullable(),
  }),
  execute: async ({ runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    const supabase = runtimeContext?.get('supabase');
    
    // Query database using userId
    const { data } = await supabase
      .from('user_routines')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    return { routine: data || null };
  },
});

// Agent: Longevity coach with the tool
export const longevityCoachAgent = new Agent({
  name: 'Longevity Coach Agent',
  instructions: `...`,
  model: mainModel,
  tools: {
    getUserRoutineTool,
  },
  memory: new Memory({ ... }),
});
```

### Pattern 2: Guest Onboarding Agent with Tools

Used for guest users who haven't created an account yet.

```typescript
// Tool: Update guest data
export const updateGuestDataTool = createTool({
  id: 'update-guest-data',
  description: 'Update guest onboarding data',
  execute: async ({ context, runtimeContext }) => {
    const guestSessionId = runtimeContext?.get('guestSessionId');
    // Update guest_onboarding_sessions table
  },
});

// Agent: Guest onboarding with tools
export const guestOnboardingAgent = new Agent({
  name: 'Guest Onboarding Agent',
  instructions: `...`,
  model: mainModel,
  tools: {
    updateGuestDataTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 20,
    },
  }),
});
```

### Pattern 3: Longevity Coach with Full Memory

The longevity coach agent uses advanced memory features:

```typescript
export const longevityCoachAgent = new Agent({
  name: 'Longevity Coach Agent',
  instructions: `...`,
  model: mainModel,
  memory: new Memory({
    storage: postgresStore,
    vector: pgVector,
    embedder: 'google/text-embedding-004',
    options: {
      lastMessages: false,  // Full history
      semanticRecall: {
        topK: 5,
        messageRange: 3,
        scope: 'resource',
      },
      workingMemory: {
        enabled: true,
        scope: 'resource',
      },
    },
  }),
});

// Use with consistent thread/resource
await longevityCoachAgent.generate('What did we discuss last week?', {
  memory: {
    thread: `longevity-coach-${user.id}`,
    resource: `longevity-coach-${user.id}`,
  },
  runtimeContext,
});
```

---

## Summary

**Agents** = Smart assistants that can have conversations and use tools
**Tools** = Functions that agents can call to perform tasks
**Workflows** = Multi-step processes that orchestrate agents and tools
**Memory** = The ability for agents to remember previous conversations

**Key Takeaways:**
1. Always register agents in your Mastra instance (`mastra` for authenticated users, `guestMastra` for guests)
2. Write clear, specific instructions for agents - focus on behavior, NOT tool usage
3. Design tools with single responsibilities and self-contained descriptions
4. Tool descriptions must be complete - they explain when and how to use tools
5. Don't explain tools in agent instructions - let tool descriptions do the work (scalable to 20+ tools)
6. Use memory with consistent `thread` and `resource` IDs
   - Longevity coach: `longevity-coach-${user.id}` for both
   - Guest onboarding: `guest-session-${sessionId}` for both
7. For longevity coach tools, always get `userId` from runtime context
8. Follow best practices for maintainable, scalable code

For more details, refer to:
- [Mastra Official Documentation](https://mastra.ai/docs)
- Your existing codebase examples in `src/mastra/`
- This project's README.md for architecture overview

