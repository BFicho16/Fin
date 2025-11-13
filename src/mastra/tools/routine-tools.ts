import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// ===== GET ACTIVE ROUTINE =====
export const getActiveRoutineTool = createTool({
  id: 'get-active-routine',
  description: 'Get the user\'s currently active routine. CRITICAL: You MUST call this tool BEFORE asking ANY questions about routines, habits, sleep, exercise, nutrition, or any routine-related information. This tool checks runtime context first (which is pre-loaded) and only queries the database if needed. After calling this tool, you MUST: 1) Check the "routine" field in the response - if null, no active routine exists; if it contains data (has an "id" field), an active routine exists. 2) If routine exists, you MUST read the "content" field (routine.content) which contains the full routine text. 3) Before asking questions about any routine topic, check if that information is already in routine.content. 4) If information exists in routine.content, reference it directly - DO NOT ask for information that\'s already documented.',
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
    // Check runtime context first (pre-loaded for every message)
    const activeRoutine = runtimeContext?.get('activeRoutine');
    if (activeRoutine !== undefined) {
      return { routine: activeRoutine };
    }

    // Fallback to database query if not in context
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
      .eq('status', 'active')
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

// ===== GET DRAFT ROUTINE =====
export const getDraftRoutineTool = createTool({
  id: 'get-draft-routine',
  description: 'Get the user\'s current draft routine. Always call this tool when users share routine information to check if a draft exists. This tool checks runtime context first (which is pre-loaded) and only queries the database if needed. There is only one draft at a time per user. After calling this tool, you MUST: 1) Check the "draft" field in the response - if null, no draft exists; if it contains data (has an "id" field), a draft exists. 2) If draft exists, you MUST read the "content" field (draft.content) which contains the full draft text. When updating drafts, you must merge new information with existing draft.content.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    draft: z.object({
      id: z.string(),
      content: z.string(),
      version: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }).nullable(),
  }),
  execute: async ({ runtimeContext }) => {
    // Check runtime context first (pre-loaded for every message)
    const draftRoutine = runtimeContext?.get('draftRoutine');
    if (draftRoutine !== undefined) {
      return { draft: draftRoutine };
    }

    // Fallback to database query if not in context
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }

    const supabase = runtimeContext?.get('supabase');
    if (!supabase) {
      throw new Error('Supabase client not found in runtime context');
    }

    const { data: draft, error } = await supabase
      .from('user_routines')
      .select('id, content, version, created_at, updated_at')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    if (error) {
      // If no rows found, return null (not an error)
      if (error.code === 'PGRST116') {
        return { draft: null };
      }
      throw new Error(`Failed to fetch draft routine: ${error.message}`);
    }

    return { draft };
  },
});

// ===== CREATE DRAFT ROUTINE =====
export const createDraftRoutineTool = createTool({
  id: 'create-draft-routine',
  description: 'Create a new draft routine for the user, or update an existing draft if one already exists. When updating an existing draft, you MUST include ALL existing content PLUS the new information merged together. Use this whenever the user explicitly wants to save/track routine information. The draft will be displayed in real-time in the user\'s "My Routine" tab. The content should be in Markdown format. Only one draft exists at a time per user. CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "draft" object with an "id" field. If the tool throws an error or returns null/empty, do NOT claim you created or updated a draft - acknowledge the error instead.',
  inputSchema: z.object({
    content: z.string().min(1, 'Content cannot be empty').describe('The routine content in Markdown format'),
  }),
  outputSchema: z.object({
    draft: z.object({
      id: z.string(),
      content: z.string(),
      version: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
    isNew: z.boolean().describe('Whether this is a new draft or an update to an existing draft'),
  }),
  execute: async ({ context, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }

    const supabase = runtimeContext?.get('supabase');
    if (!supabase) {
      throw new Error('Supabase client not found in runtime context');
    }

    // Check if a draft already exists
    const { data: existingDraft } = await supabase
      .from('user_routines')
      .select('id, version')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    if (existingDraft) {
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('user_routines')
        .update({
          content: context.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDraft.id)
        .select('id, content, version, created_at, updated_at')
        .single();

      if (updateError) {
        throw new Error(`Failed to update draft routine: ${updateError.message}`);
      }

      return {
        draft: updatedDraft,
        isNew: false,
      };
    }

    // Create new draft - get next version number
    const { data: maxVersion } = await supabase
      .from('user_routines')
      .select('version')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = maxVersion ? maxVersion.version + 1 : 1;

    // Create new draft routine
    const { data: newDraft, error: createError } = await supabase
      .from('user_routines')
      .insert({
        user_id: userId,
        content: context.content,
        version: nextVersion,
        status: 'draft', // Draft is not active
      })
      .select('id, content, version, created_at, updated_at')
      .single();

    if (createError) {
      throw new Error(`Failed to create draft routine: ${createError.message}`);
    }

    return {
      draft: newDraft,
      isNew: true,
    };
  },
});

// ===== UPDATE DRAFT ROUTINE =====
export const updateDraftRoutineTool = createTool({
  id: 'update-draft-routine',
  description: 'Update the content of the user\'s current draft routine. Use this when the user wants to modify their existing draft routine. The content should be in Markdown format. The draft will be displayed in real-time in the user\'s "My Routine" tab. If no draft exists, this will fail - use createDraftRoutineTool instead. CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "draft" object with an "id" field. If the tool throws an error or returns null/empty, do NOT claim you updated the draft - acknowledge the error instead.',
  inputSchema: z.object({
    content: z.string().min(1, 'Content cannot be empty').describe('The updated routine content in Markdown format'),
  }),
  outputSchema: z.object({
    draft: z.object({
      id: z.string(),
      content: z.string(),
      version: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  }),
  execute: async ({ context, runtimeContext }) => {
    const userId = runtimeContext?.get('userId');
    if (!userId) {
      throw new Error('User ID not found in runtime context');
    }

    const supabase = runtimeContext?.get('supabase');
    if (!supabase) {
      throw new Error('Supabase client not found in runtime context');
    }

    // Find existing draft
    const { data: existingDraft, error: findError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        throw new Error('No draft routine exists. Create a draft first using createDraftRoutineTool.');
      }
      throw new Error(`Failed to find draft routine: ${findError.message}`);
    }

    // Update draft
    const { data: updatedDraft, error: updateError } = await supabase
      .from('user_routines')
      .update({
        content: context.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDraft.id)
      .select('id, content, version, created_at, updated_at')
      .single();

    if (updateError) {
      throw new Error(`Failed to update draft routine: ${updateError.message}`);
    }

    return { draft: updatedDraft };
  },
});

// ===== ACTIVATE DRAFT ROUTINE =====
export const activateDraftRoutineTool = createTool({
  id: 'activate-draft-routine',
  description: 'Activate the user\'s draft routine, making it their active routine. This will deactivate any previously active routine. CRITICAL: Only use this tool when the user EXPLICITLY requests to activate their draft routine with clear statements like "activate it", "make it active", "activate the routine", "I want to activate it", etc. NEVER activate without explicit, clear permission - the user must explicitly ask for activation. If the user just says "yes", "okay", "sounds good", or similar vague responses, DO NOT activate - they need to explicitly say they want to activate. The draft must exist - if no draft exists, this will fail. CRITICAL: After calling this tool, you MUST check the return value before reporting success. Only report success if the tool returns a "routine" object with an "id" field. If the tool throws an error or returns null/empty, do NOT claim you activated the routine - acknowledge the error instead.',
  inputSchema: z.object({}),
  outputSchema: z.object({
    routine: z.object({
      id: z.string(),
      content: z.string(),
      version: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
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

    // Find draft routine
    const { data: draft, error: findError } = await supabase
      .from('user_routines')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') {
        throw new Error('No draft routine exists to activate.');
      }
      throw new Error(`Failed to find draft routine: ${findError.message}`);
    }

    // Mark any currently active routine as past
    await supabase
      .from('user_routines')
      .update({ status: 'past' })
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null);

    // Activate the draft
    const { data: activatedRoutine, error: activateError } = await supabase
      .from('user_routines')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)
      .select('id, content, version, created_at, updated_at')
      .single();

    if (activateError) {
      throw new Error(`Failed to activate draft routine: ${activateError.message}`);
    }

    return { routine: activatedRoutine };
  },
});

