import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const { searchParams } = new URL(request.url);
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('supplements')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('taken_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('taken_at', start_date);
    }
    if (end_date) {
      query = query.lte('taken_at', end_date);
    }

    const { data: supplements, error: supplementsError } = await query;

    if (supplementsError) {
      return Response.json({ error: 'Failed to fetch supplements' }, { status: 400 });
    }

    return Response.json({ supplements });
  } catch (error) {
    console.error('Error fetching supplements:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const supplement = await request.json();

    // Validate required fields
    if (!supplement.supplement_name || !supplement.dosage) {
      return Response.json({ error: 'Missing required fields: supplement_name, dosage' }, { status: 400 });
    }

    // Create new supplement
    const { data: newSupplement, error: supplementError } = await supabase
      .from('supplements')
      .insert({
        user_id: resolvedParams.userId,
        supplement_name: supplement.supplement_name,
        dosage: supplement.dosage,
        frequency: 'as_needed', // Default for individual intake logging
        notes: supplement.notes || null
      })
      .select()
      .single();

    if (supplementError) {
      return Response.json({ error: 'Failed to log supplement' }, { status: 400 });
    }

    return Response.json({ supplement: newSupplement });
  } catch (error) {
    console.error('Error logging supplement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
