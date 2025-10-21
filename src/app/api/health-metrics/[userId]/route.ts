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
    const metric_type = searchParams.get('metric_type');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('health_metrics_log')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (metric_type) {
      query = query.eq('metric_type', metric_type);
    }
    if (start_date) {
      query = query.gte('logged_at', start_date);
    }
    if (end_date) {
      query = query.lte('logged_at', end_date);
    }

    const { data: metrics, error: metricsError } = await query;

    if (metricsError) {
      return Response.json({ error: 'Failed to fetch health metrics' }, { status: 400 });
    }

    return Response.json({ metrics });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
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

    const metric = await request.json();

    // Validate required fields
    if (!metric.metric_type || !metric.value || !metric.unit) {
      return Response.json({ error: 'Missing required fields: metric_type, value, unit' }, { status: 400 });
    }

    // Validate metric_type
    const validMetricTypes = ['weight', 'height', 'body_fat_percentage', 'muscle_mass', 'bmi', 'waist_circumference', 'chest_circumference', 'hip_circumference'];
    if (!validMetricTypes.includes(metric.metric_type)) {
      return Response.json({ error: 'Invalid metric_type' }, { status: 400 });
    }

    // Create new health metric
    const { data: newMetric, error: metricError } = await supabase
      .from('health_metrics_log')
      .insert({
        user_id: resolvedParams.userId,
        metric_type: metric.metric_type,
        value: metric.value,
        unit: metric.unit,
        notes: metric.notes || null,
        source: 'manual_entry'
      })
      .select()
      .single();

    if (metricError) {
      return Response.json({ error: 'Failed to log health metric' }, { status: 400 });
    }

    return Response.json({ metric: newMetric });
  } catch (error) {
    console.error('Error logging health metric:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
