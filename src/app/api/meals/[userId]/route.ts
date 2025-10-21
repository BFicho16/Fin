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
      .from('meals')
      .select('*')
      .eq('user_id', resolvedParams.userId)
      .order('consumed_at', { ascending: false })
      .limit(limit);

    if (start_date) {
      query = query.gte('consumed_at', start_date);
    }
    if (end_date) {
      query = query.lte('consumed_at', end_date);
    }

    const { data: meals, error: mealsError } = await query;

    if (mealsError) {
      return Response.json({ error: 'Failed to fetch meals' }, { status: 400 });
    }

    return Response.json({ meals });
  } catch (error) {
    console.error('Error fetching meals:', error);
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

    const meal = await request.json();

    // Validate required fields
    if (!meal.meal_type || !meal.foods) {
      return Response.json({ error: 'Missing required fields: meal_type, foods' }, { status: 400 });
    }

    // Validate meal_type
    const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!validMealTypes.includes(meal.meal_type)) {
      return Response.json({ error: 'Invalid meal_type' }, { status: 400 });
    }

    // Create new meal
    const { data: newMeal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: resolvedParams.userId,
        meal_type: meal.meal_type,
        foods: meal.foods,
        macros: meal.macros || null,
        total_calories: meal.total_calories || null,
        notes: meal.notes || null
      })
      .select()
      .single();

    if (mealError) {
      return Response.json({ error: 'Failed to log meal' }, { status: 400 });
    }

    return Response.json({ meal: newMeal });
  } catch (error) {
    console.error('Error logging meal:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
