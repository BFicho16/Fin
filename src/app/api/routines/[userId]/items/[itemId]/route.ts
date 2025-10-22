import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = await params;
    if (!user || user.id !== resolvedParams.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', resolvedParams.itemId)
      .eq('user_routines.user_id', resolvedParams.userId)
      .single();

    if (itemError || !item) {
      return Response.json({ error: 'Routine item not found or access denied' }, { status: 404 });
    }

    // Update routine item
    const { data: updatedItem, error: updateError } = await supabase
      .from('routine_items')
      .update(updates)
      .eq('id', resolvedParams.itemId)
      .select()
      .single();

    if (updateError) {
      return Response.json({ error: 'Failed to update routine item' }, { status: 400 });
    }

    return Response.json({ item: updatedItem });
  } catch (error) {
    console.error('Error updating routine item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; itemId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const resolvedParams = await params;
    if (!user || user.id !== resolvedParams.userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify item ownership through routine
    const { data: item, error: itemError } = await supabase
      .from('routine_items')
      .select(`
        id,
        user_routines!inner (
          user_id
        )
      `)
      .eq('id', resolvedParams.itemId)
      .eq('user_routines.user_id', resolvedParams.userId)
      .single();

    if (itemError || !item) {
      return Response.json({ error: 'Routine item not found or access denied' }, { status: 404 });
    }

    // Delete routine item
    const { error: deleteError } = await supabase
      .from('routine_items')
      .delete()
      .eq('id', resolvedParams.itemId);

    if (deleteError) {
      return Response.json({ error: 'Failed to delete routine item' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
