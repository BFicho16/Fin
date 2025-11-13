# Mastra Agent Development Guide

This guide documents best practices and patterns for building reliable Mastra agents and tools, based on lessons learned from the longevity coach agent.

## Core Principles

### 1. Keep Instructions Simple and Explicit

**Problem**: Long, complex instructions (~160+ lines) cause agents to miss critical steps and make inconsistent decisions.

**Solution**: 
- Keep instructions to ~80 lines or less
- Use explicit decision trees instead of verbose prose
- Make mandatory steps stand out clearly
- Remove redundancy and consolidate related sections

**Example Pattern**:
```
DECISION TREE - Before any routine-related response:

1. User asks question/requests recommendations:
   → MANDATORY: Call getActiveRoutineTool FIRST
   → If active routine exists: Reference it, don't ask for info
   → If no active routine: Answer based on context
   → DO NOT create drafts for questions/recommendations

2. User shares routine information:
   → MANDATORY: Call getActiveRoutineTool and getDraftRoutineTool
   → If user is ASKING for opinion: Respond conversationally
   → If user explicitly wants to TRACK/SAVE: Create/update draft
   → When in doubt, just have conversation - don't create drafts
```

### 2. Separate Conversation from Action Modes

**Problem**: Agents create/modify resources when users are just having conversations, leading to unwanted actions.

**Solution**: Explicitly define two distinct modes:

**CONVERSATION MODE** (default):
- For questions, advice, discussions
- Answer questions and give recommendations
- Discuss topics conversationally
- DO NOT create or update resources in this mode

**ACTION MODE**:
- Only when user explicitly wants to save/track/change something
- User says "save this", "create a routine", "update my routine", "track this"
- Then create/update resources as needed
- When in doubt, stay in conversation mode

**Example Pattern**:
```
CONVERSATION VS ACTION MODE
There are two distinct modes of interaction:

1. **CONVERSATION MODE** (default) - For questions, advice, discussions:
   • Answer questions about routines and habits
   • Give recommendations and suggestions
   • Discuss their routines conversationally
   • DO NOT create or update drafts in conversation mode

2. **ACTION MODE** - Only when user explicitly wants to save/track/change:
   • User says "save this", "create a routine", "update my routine"
   • Then create/update drafts as needed
   • When in doubt, stay in conversation mode
```

### 3. Mandatory State Checks

**Problem**: Agents ask for information that's already available or don't recognize existing resources.

**Solution**: 
- Make state checking mandatory and explicit
- Use MANDATORY/MUST keywords for critical steps
- Check state BEFORE responding, not after
- Never ask for information you can check yourself

**Example Pattern**:
```
DECISION TREE - Before any routine-related response:

1. User asks question/requests recommendations:
   → MANDATORY: Call getActiveRoutineTool FIRST
   → If active routine exists: Reference it, don't ask for info they already provided
   → If no active routine: Answer based on conversation context
```

### 4. Tool Result Verification

**Problem**: Agents claim to have performed actions without actually verifying tool execution succeeded (hallucination).

**Solution**: 
- Always verify tool results before reporting success
- Only report success if tool returns valid data
- Acknowledge errors instead of claiming success
- Make verification explicit in both instructions and tool descriptions

**Instruction Pattern**:
```
TOOL RESULT VERIFICATION
• After calling ANY tool, you MUST check the return value before reporting success
• Only report success if the tool returns valid data (e.g., draft object with 'id' field)
• If a tool throws an error or returns null/empty, acknowledge the error - do NOT claim success
• If createDraftRoutineTool fails or returns null, do NOT say "I've created a draft"
• Verify tool results match what you're reporting to the user
```

**Tool Description Pattern**:
```
description: 'Create a new draft routine... CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "draft" object with an "id" field. If the tool throws an error or returns null/empty, do NOT claim you created or updated a draft - acknowledge the error instead.'
```

### 5. Clear Decision Trees

**Problem**: Decision logic buried in prose leads to inconsistent behavior.

**Solution**: 
- Use explicit decision trees with numbered steps
- Make each branch clear with simple if/then logic
- Use arrows (→) to show flow
- Highlight MANDATORY steps

**Example Structure**:
```
DECISION TREE - Before any [resource]-related response:

1. User asks question/requests recommendations:
   → MANDATORY: Call get[Resource]Tool FIRST
   → If resource exists: Reference it, don't ask
   → If no resource: Answer based on context
   → DO NOT create resources for questions

2. User shares information:
   → MANDATORY: Call get[Resource]Tool
   → If user is ASKING for opinion: Respond conversationally
   → If user explicitly wants to SAVE: Create/update resource
   → When in doubt, just have conversation

3. User explicitly requests changes:
   → MANDATORY: Call get[Resource]Tool
   → Create or update based on request
```

## Tool Development Patterns

### Tool Descriptions Must Include Verification

Every tool description should explicitly require result verification:

```typescript
// Good: Includes verification requirement
description: 'Create a draft routine... CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "draft" object with an "id" field. If the tool throws an error, do NOT claim success - acknowledge the error instead.'

// Bad: No verification requirement
description: 'Create a draft routine. Use this when the user wants to create a routine.'
```

### State Checking Tools

State checking tools should explicitly document what to check:

```typescript
// Good: Tells agent what to check
description: 'Get the user\'s active routine. After calling this tool, you MUST check the "routine" field in the response. If it is null, no active routine exists. If it contains data (has an "id" field), an active routine exists.'

// Bad: Doesn't tell agent what to check
description: 'Get the user\'s active routine.'
```

### Action Tools

Action tools (create, update, delete) should emphasize verification:

```typescript
// Good: Explicit verification requirement
description: 'Create a draft routine... CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "draft" object with an "id" field. If the tool throws an error or returns null/empty, do NOT claim you created a draft - acknowledge the error instead.'

// Bad: No verification requirement
description: 'Create a draft routine. Returns the created draft.'
```

## Instruction Structure

### Recommended Sections (in order)

1. **CORE IDENTITY** - Brief description of the agent's role
2. **TONE & COMMUNICATION** - How to communicate with users
3. **CONVERSATION VS ACTION MODE** - Explicit separation (if applicable)
4. **DECISION TREE** - Explicit decision logic (mandatory)
5. **TOOL RESULT VERIFICATION** - How to verify tool execution (mandatory)
6. **RESOURCE MANAGEMENT** - How to manage resources (if applicable)
7. **WORKING MEMORY** - How to use memory (if applicable)
8. **WHAT TO AVOID** - Key mistakes to avoid

### Keep Sections Brief

- Each section should be 5-10 bullet points max
- Use simple, direct language
- Avoid redundancy between sections
- Consolidate related information

## Common Pitfalls to Avoid

### 1. Over-Complication

**Don't**: Create 160+ line instructions with redundant sections
**Do**: Keep it under 80 lines, consolidate related information

### 2. Buried Critical Steps

**Don't**: Hide mandatory checks in prose paragraphs
**Do**: Use explicit decision trees with MANDATORY keywords

### 3. No Verification Requirements

**Don't**: Assume agent will verify tool results
**Do**: Explicitly require verification in both instructions and tool descriptions

### 4. Ambiguous Mode Boundaries

**Don't**: Unclear when to create resources vs just talk
**Do**: Explicitly define conversation vs action modes

### 5. Asking for Available Information

**Don't**: Ask users to share information you can check
**Do**: Always check state first, then reference what exists

## Example: Minimal Effective Instructions

```
You are a [role] focused on [primary goal]. You [main actions].

CORE IDENTITY
• [Key characteristics]
• [Primary objectives]

TONE & COMMUNICATION
• [Communication style]
• [Key behaviors]

CONVERSATION VS ACTION MODE
[Explicit separation if applicable]

DECISION TREE - Before any [resource]-related response:
1. User asks question:
   → MANDATORY: Call get[Resource]Tool FIRST
   → [Logic based on result]

2. User shares information:
   → MANDATORY: Call get[Resource]Tool
   → [Logic based on intent]

TOOL RESULT VERIFICATION
• After calling ANY tool, you MUST check the return value
• Only report success if tool returns valid data
• Acknowledge errors, don't claim success

[RESOURCE] MANAGEMENT
• [Key management rules]
• [When to create/update]

WHAT TO AVOID
• [Key mistakes]
• [What not to do]
```

## Testing Checklist

When building a new agent or tool, verify:

- [ ] Instructions are under 80 lines
- [ ] Decision tree is explicit and clear
- [ ] State checks are mandatory
- [ ] Conversation vs action modes are separated (if applicable)
- [ ] Tool descriptions require result verification
- [ ] Agent checks state before asking questions
- [ ] Agent verifies tool results before reporting success
- [ ] Agent doesn't create resources in conversation mode
- [ ] Agent handles errors gracefully

## Summary

The key to reliable agents is:
1. **Simplicity** - Keep instructions brief and explicit
2. **Clarity** - Use decision trees, not prose
3. **Verification** - Always verify tool results
4. **Separation** - Distinguish conversation from action
5. **Mandatory Checks** - Make state checks explicit and required

Follow these patterns to build agents that are reliable, predictable, and user-friendly.

