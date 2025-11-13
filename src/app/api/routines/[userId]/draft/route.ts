import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch current draft routine
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get draft routine
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
        return NextResponse.json({ draft: null });
      }
      return NextResponse.json(
        { error: `Failed to fetch draft: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error in GET draft API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update draft routine (manual edit)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and cannot be empty' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: 'No draft routine exists. Create a draft first.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Failed to find draft: ${findError.message}` },
        { status: 500 }
      );
    }

    // Update draft
    const { data: updatedDraft, error: updateError } = await supabase
      .from('user_routines')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingDraft.id)
      .select('id, content, version, created_at, updated_at')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update draft: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft: updatedDraft });
  } catch (error) {
    console.error('Error in PUT draft API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

