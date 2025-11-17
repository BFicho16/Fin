# Mastra.AI Guide: Patterns and Practices

This guide explains the patterns we use with Mastra.AI in this codebase. It focuses on how things work, not implementation details.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Agents](#agents)
3. [Tools](#tools)
4. [Real-Time UI Updates](#real-time-ui-updates)
5. [Memory](#memory)
6. [Subscription Requirements](#subscription-requirements)
7. [Key Patterns](#key-patterns)

---

## Core Concepts

**Agents** = AI assistants that have conversations and use tools  
**Tools** = Functions agents call to perform tasks (database operations, API calls, etc.)  
**Memory** = Agents remember past conversations and user context  
**Runtime Context** = Request-specific data (user ID, page info, etc.) passed to agents

We have two agents:
- **Longevity Coach Agent** (`longevityCoachAgent`) - for authenticated users
- **Guest Onboarding Agent** (`guestOnboardingAgent`) - for guest users

---

## Agents

### Agent Instructions: Behavior, Not Tools

**Critical Rule**: Agent instructions should focus on **personality and behavior**, NOT tool usage.

**Why?** Tool descriptions already explain when and how to use tools. Explaining them in instructions:
- Duplicates information (maintenance burden)
- Increases token costs
- Doesn't scale (imagine 20+ tools in instructions)

**Good Instructions:**
```
You are a supportive longevity coach focused on routines and habits. 
Ask only ONE question at a time. Reference past conversations naturally. 
Celebrate progress, no matter how small.
```

**Bad Instructions:**
```
Use getActiveRoutineTool to check their routine. Use createDraftRoutineTool 
to create drafts... ❌ Don't do this!
```

### Longevity Coach Agent

The primary agent for authenticated users. It:
- Remembers entire conversation history
- Uses semantic search to find relevant past conversations
- Maintains structured user information (working memory)
- References past conversations naturally
- Makes iterative recommendations to improve routines

**Memory Configuration:**
- Full conversation history (not just recent messages)
- Semantic recall (finds related past conversations)
- Working memory (structured user profile that persists)
- Tracks recommendations made and user feedback

**Recommendation Cycle:**
The agent follows an iterative improvement pattern:
1. **Collects routine data** through conversation
2. **Makes ONE recommendation** at a time (sleep/eating/fitness)
3. **Asks user to try it** for a week
4. **Automatically activates** updated routine when accepted
5. **Iterates based on feedback** - continues the cycle

**When Recommendations Are Made:**
- After user activates their first routine
- When user explicitly asks for suggestions
- When user shares routine updates or performance feedback

**Thread/Resource IDs:** `longevity-coach-${user.id}` (same for both)

### Guest Onboarding Agent

Simple agent for guest users who haven't created accounts. Uses limited memory (last 20 messages).

**Thread/Resource IDs:** `guest-session-${sessionId}` (same for both)

---

## Tools

### Tool Pattern: Self-Contained Descriptions

Tool descriptions must be **complete and self-contained**. The agent uses these to understand when and how to use tools.

**Good Description:**
```
Create a new draft routine for the user, or update an existing draft if one 
already exists. Use this when the user explicitly wants to save/track routine 
information. The draft will be displayed in real-time in the user's "My Routine" 
tab. Only one draft exists at a time per user.
```

**What Makes It Good:**
- Explains what it does
- Explains when to use it
- Mentions user-facing effects (real-time display)
- Explains constraints (only one draft)

### Tool Naming Convention

Follow `[action][noun]Tool` pattern for variable names:
- `getActiveRoutineTool`
- `createDraftRoutineTool`
- `updateDraftRoutineTool`
- `activateDraftRoutineTool`

**Tool IDs** (used in `tool.id`) should be kebab-case:
- `'get-active-routine'`
- `'create-draft-routine'`
- `'update-draft-routine'`
- `'activate-draft-routine'`

The variable name is what Mastra returns in tool results; the ID is what we use in our code. The API route maps between them.

### Accessing User Data

All authenticated user tools get data from `runtimeContext`:

```typescript
execute: async ({ runtimeContext }) => {
  const userId = runtimeContext?.get('userId');
  const supabase = runtimeContext?.get('supabase');
  // Use userId and supabase to query database
}
```

**Key Points:**
- Always get `userId` from runtime context (never hardcode)
- Supabase client is also in runtime context
- Throw clear errors if required context is missing

### Tool Name vs Tool ID

**Important**: Mastra returns tool names as variable names (e.g., `'updateDraftRoutineTool'`), but we use tool IDs (e.g., `'update-draft-routine'`) for consistency. The API route maps variable names to tool IDs before emitting to the client.

- **Variable name**: What Mastra returns in `chunk.payload.toolName` (matches export name)
- **Tool ID**: What we use in code (`tool.id` field) - kebab-case format
- **Mapping**: Defined in `src/app/api/chat/route.ts` in `toolNameToIdMap`

### Tool Result Structure

Tools that modify data should return the complete updated object:

```typescript
// Good: Returns complete object
return { draft: { id: '...', content: '...', ... } };

// Bad: Returns just success flag
return { success: true };
```

This enables real-time UI updates (see below).

---

## Real-Time UI Updates

When agents execute tools that modify data, the UI updates **immediately** without polling.

### The Pattern: Tool → Cache Update

1. **Agent executes tool** → Tool creates/updates data in database
2. **Tool result streamed to client** → Included in agent's stream response
3. **React Query cache updated** → Client immediately updates cache with tool result
4. **UI updates instantly** → React Query triggers re-render

**Why This Works:**
- Tool result contains the exact data that was created/updated
- We already have the data, so no need to fetch it again
- No polling, no delays, no flakiness

### How It Works

**1. Chat API streams tool results**

The chat API uses `fullStream` (not `textStream`) to access tool results. **Important**: Mastra returns tool names as variable names (e.g., `'updateDraftRoutineTool'`), but we use tool IDs (e.g., `'update-draft-routine'`) in our code. The API maps variable names to tool IDs:

```typescript
// Map Mastra tool names (variable names) to tool IDs (kebab-case)
const toolNameToIdMap: Record<string, string> = {
  'createDraftRoutineTool': 'create-draft-routine',
  'updateDraftRoutineTool': 'update-draft-routine',
  'activateDraftRoutineTool': 'activate-draft-routine',
  // ... etc
};

for await (const chunk of response.fullStream) {
  if (chunk.type === 'tool-result') {
    const mastraToolName = chunk.payload.toolName; // e.g., 'updateDraftRoutineTool'
    const toolId = toolNameToIdMap[mastraToolName]; // e.g., 'update-draft-routine'
    // Emit tool result to client with mapped tool ID
  }
}
```

**2. Chat interface updates cache**

When tool results arrive, update React Query cache using the tool ID:

```typescript
if (toolId === 'create-draft-routine') {
  queryClient.setQueryData(
    [['routine', 'getDraftRoutine'], { input: { userId } }],
    result.draft
  );
}
```

**3. Components use TRPC queries**

Components use TRPC queries (no polling):

```typescript
const { data: draft } = api.routine.getDraftRoutine.useQuery({ userId });
// UI automatically updates when cache changes
```

### Adding Real-Time Updates to New Tools

1. **Add tool name mapping** in `src/app/api/chat/route.ts` - Map Mastra variable name to tool ID:
   ```typescript
   const toolNameToIdMap: Record<string, string> = {
     'yourNewToolName': 'your-new-tool-id',
   };
   ```

2. **Add tool ID to watch list** in `src/app/api/chat/route.ts`:
   ```typescript
   const routineToolIds = ['your-new-tool-id', ...];
   ```

3. **Add cache update logic** in `src/components/chat/chat-interface-base.tsx`:
   ```typescript
   if (toolId === 'your-new-tool-id') {
     queryClient.setQueryData(queryKey, result.data);
   }
   ```

4. **Create TRPC query** (if needed) in router

5. **Use TRPC query in component** (replace any polling)

### When to Use This Pattern

✅ Use when:
- Tool creates/updates data displayed in UI
- Tool result contains complete data
- You want immediate updates

❌ Don't use when:
- Tool only reads data (no UI update needed)
- Multiple users modify same data (use Supabase Realtime)
- Tool result incomplete (use query invalidation instead)

---

## Memory

Memory allows agents to remember conversations and maintain context.

### Longevity Coach Memory

Uses advanced memory features:
- **Full history**: Access entire conversation history
- **Semantic recall**: Finds relevant past conversations using vector search
- **Working memory**: Structured user profile that persists across conversations

### Guest Onboarding Memory

Simple memory: Last 20 messages only.

### Thread vs Resource

- **Thread**: Specific conversation/session
- **Resource**: Stable identifier for user/entity

For both agents, use the same value for thread and resource:
- Longevity coach: `longevity-coach-${user.id}`
- Guest onboarding: `guest-session-${sessionId}`

---

## Subscription Requirements

### Pro Subscription for Routine Activation

**Requirement**: Users must have an active Pro subscription to activate routines. This applies to both:
- First-time routine activation (no previous active/past routines)
- Subsequent routine activations (users who have activated before)

**Pro Status**: A user is considered "Pro" if their subscription status is:
- `'active'` - Active paid subscription
- `'trialing'` - In trial period

**Non-Pro Statuses**: Users are NOT Pro if:
- No subscription exists (null)
- Status is `'canceled'`, `'past_due'`, or `'incomplete'`

### How It Works

**1. Agent Tool Validation**

The `activateDraftRoutineTool` checks subscription status before activation:

```typescript
// Check if user has pro subscription
const { data: subscription } = await supabase
  .from('user_subscriptions')
  .select('status')
  .eq('user_id', userId)
  .single();

const isPro = subscription && 
  (subscription.status === 'active' || subscription.status === 'trialing');

// Check if this is first activation
const { data: existingRoutines } = await supabase
  .from('user_routines')
  .select('id')
  .eq('user_id', userId)
  .in('status', ['active', 'past'])
  .limit(1);

const isFirstActivation = !existingRoutines || existingRoutines.length === 0;

// Block activation if not pro
if (!isPro) {
  if (isFirstActivation) {
    throw new Error('To activate your first routine, you need a Pro subscription. Please upgrade to continue.');
  } else {
    throw new Error('A Pro subscription is required to activate routines. Please upgrade to continue.');
  }
}
```

**2. Frontend Validation**

The UI also checks subscription before showing the activation dialog:

```typescript
const isPro = isProUser(subscription ?? null);
const isFirstActivation = !hasExistingRoutines && !routine;

if (isFirstActivation && !isPro) {
  router.replace(`${pathname}?upgrade=true`);
  return; // Prevent activation
}
```

**3. Upgrade Modal Integration**

When a subscription error is detected:
- **Agent path**: Tool throws error → Chat API detects subscription-related error → Emits `upgrade-required` event → Frontend receives event → Updates URL query params → Modal opens
- **UI path**: User clicks activate → Frontend checks subscription → Updates URL query params → Modal opens

The upgrade modal automatically opens when `?upgrade=true` is in the URL (handled by `UpgradeModal` component).

**4. Error Detection in Chat API**

The chat API detects subscription-related errors from tool results:

```typescript
// Check if error is subscription-related
const isSubscriptionError = isError && 
  errorMessage &&
  (errorMessage.includes('Pro subscription') || 
   errorMessage.includes('subscription') ||
   errorMessage.includes('upgrade'));

// Emit upgrade-required event
if (isSubscriptionError) {
  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify({ type: 'upgrade-required' })}\n\n`)
  );
}
```

**5. Frontend Event Handling**

The chat interface listens for `upgrade-required` events:

```typescript
if (parsed.type === 'upgrade-required') {
  onUpgradeRequired(); // Updates URL query params, opens modal
}
```

### Key Points

- **Validation happens in multiple places**: Agent tool (server-side), frontend UI, and API route
- **First activation check**: Determines if user has ever activated a routine before
- **Error messages**: Different messages for first activation vs. subsequent activations
- **No page reloads**: URL query params updated smoothly without navigation
- **Stream continues**: Upgrade modal opens without interrupting the chat stream

### Subscription Utility

Use the `isProUser()` helper function to check subscription status:

```typescript
import { isProUser } from '@/lib/subscription';

const isPro = isProUser(subscription); // subscription can be null
```

---

## Key Patterns

### Pattern 1: Agent with Database Tools

**Structure:**
1. Agent has tools that query/update database
2. Tools get `userId` from runtime context
3. Tools return complete data objects
4. Tool results update UI in real-time

**Example Flow:**
```
User: "Create a morning routine"
Agent → createDraftRoutineTool → Database
Tool returns: { draft: {...} }
Mastra sends: toolName='createDraftRoutineTool'
API maps: 'createDraftRoutineTool' → 'create-draft-routine'
API emits: toolId='create-draft-routine' to client
Client updates: React Query cache with draft data
UI updates instantly
```

### Pattern 1b: Iterative Recommendation Cycle

**Structure:**
1. Agent analyzes user's active routine
2. Makes ONE specific recommendation (sleep/eating/fitness)
3. User accepts recommendation
4. Agent automatically creates and activates updated routine
5. Agent asks for feedback after a week
6. Cycle continues with next recommendation

**Example Flow:**
```
User: "Any recommendations?"
Agent → getActiveRoutineTool → Analyzes routine
Agent: "Try going to bed 30 minutes earlier. Would you like to try this for a week?"
User: "Yes, let's try it"
Agent → createDraftRoutineTool → activateDraftRoutineTool
Tool returns: { routine: {...} }
Mastra sends: toolName='activateDraftRoutineTool'
API maps: 'activateDraftRoutineTool' → 'activate-draft-routine'
API emits: toolId='activate-draft-routine' to client
Client updates: React Query cache (active routine + clears draft)
UI updates instantly
Agent: "I've updated your routine. Try it for a week and let me know how you feel!"
```

### Pattern 2: Real-Time UI Updates

**Structure:**
1. Tool creates/updates data
2. Tool result streamed to client
3. React Query cache updated immediately
4. Component re-renders with new data

**No polling needed** - updates happen instantly when tools complete.

### Pattern 3: Self-Contained Tool Descriptions

**Structure:**
- Tool description explains: what, when, why, constraints
- Agent instructions focus on: personality, behavior, tone
- Tool descriptions handle: when to use tools, how they work

**Why:** Scales to 20+ tools without bloating agent instructions.

### Pattern 4: Runtime Context for User Data

**Structure:**
- All user-specific data comes from `runtimeContext`
- Never hardcode user IDs or session data
- Runtime context includes: `userId`, `supabase`, `currentPage`, etc.

**Why:** Keeps tools reusable and testable.

### Pattern 5: Always Check Routine First

**Structure:**
- Before asking about routines/habits: Call `getActiveRoutineTool` first
- Read `routine.content` completely if routine exists
- Never ask about information already in `routine.content` - reference it instead
- This prevents redundant questions and shows continuity

**Why:** Users see the agent remembers their routine, improving trust and experience.

---

## Summary

**Key Principles:**

1. **Agent instructions** = Behavior and personality (NOT tool usage)
2. **Tool descriptions** = Complete and self-contained (explain everything)
3. **Real-time updates** = Tool results → Cache → UI (no polling)
4. **Runtime context** = Source of truth for user/session data
5. **Memory** = Consistent thread/resource IDs per user/session
6. **Recommendation cycle** = Iterative improvements (one at a time, with feedback)
7. **Always check routine first** = Read existing routine before asking questions
8. **Subscription gating** = Pro subscription required for routine activation (checked in tool, frontend, and API)

**File References:**
- Agents: `src/mastra/agents/`
- Tools: `src/mastra/tools/`
- Chat API: `src/app/api/chat/route.ts`
- Chat Interface: `src/components/chat/chat-interface-base.tsx`
- TRPC Routers: `src/server/routers/`
- Subscription Utility: `src/lib/subscription.ts`
- Upgrade Modal: `src/components/subscription/upgrade-modal.tsx`

For implementation details, see the code. For Mastra concepts, see [official docs](https://mastra.ai/docs).
