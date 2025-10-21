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
    const exercise_type = searchParams.get('exercise_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('exercises')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('performed_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('performed_at', start_date);
    }
    if (end_date) {
      query = query.lte('performed_at', end_date);
    }
    if (exercise_type) {
      query = query.eq('exercise_type', exercise_type);
    }

    const { data: exercises, error: exercisesError } = await query;

    if (exercisesError) {
      return Response.json({ error: 'Failed to fetch exercises' }, { status: 400 });
    }

    return Response.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
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

    const exercise = await request.json();

    // Validate required fields
    if (!exercise.exercise_type || !exercise.exercise_name || !exercise.duration_minutes) {
      return Response.json({ error: 'Missing required fields: exercise_type, exercise_name, duration_minutes' }, { status: 400 });
    }

    // Validate exercise_type
    const validExerciseTypes = ['cardio', 'strength', 'flexibility', 'sports', 'yoga', 'pilates', 'swimming', 'cycling', 'running', 'walking'];
    if (!validExerciseTypes.includes(exercise.exercise_type)) {
      return Response.json({ error: 'Invalid exercise_type' }, { status: 400 });
    }

    // Validate intensity_level if provided
    if (exercise.intensity_level) {
      const validIntensityLevels = ['low', 'moderate', 'high'];
      if (!validIntensityLevels.includes(exercise.intensity_level)) {
        return Response.json({ error: 'Invalid intensity_level' }, { status: 400 });
      }
    }

    // Create new exercise
    const { data: newExercise, error: exerciseError } = await supabase
      .from('exercises')
      .insert({
        user_id: resolvedParams.userId,
        exercise_type: exercise.exercise_type,
        exercise_name: exercise.exercise_name,
        duration_minutes: exercise.duration_minutes,
        intensity_level: exercise.intensity_level || null,
        calories_burned: exercise.calories_burned || null,
        notes: exercise.notes || null
      })
      .select()
      .single();

    if (exerciseError) {
      return Response.json({ error: 'Failed to log exercise' }, { status: 400 });
    }

    return Response.json({ exercise: newExercise });
  } catch (error) {
    console.error('Error logging exercise:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
