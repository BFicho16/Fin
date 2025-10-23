import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { guestSessionId } = await request.json();
    
    if (!guestSessionId) {
      return Response.json({ error: 'Missing guestSessionId' }, { status: 400 });
    }
    
    // Fetch the ONE row for this session
    const { data: guestSession } = await supabase
      .from('guest_onboarding_sessions')
      .select('*')
      .eq('session_id', guestSessionId)
      .single();
    
    if (!guestSession) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Migrate JSON → structured tables
    
    // 1. Profile
    if (guestSession.profile && Object.keys(guestSession.profile).length > 0) {
      await supabase
        .from('user_profiles')
        .update(guestSession.profile)
        .eq('id', user.id);
    }
    
    // 2. Health metrics
    if (guestSession.health_metrics?.length > 0) {
      const metricsWithUserId = guestSession.health_metrics.map((m: any) => ({
        user_id: user.id,
        metric_type: m.metric_type,
        value: m.value,
        unit: m.unit,
        logged_at: m.logged_at,
      }));
      
      await supabase
        .from('health_metrics_log')
        .insert(metricsWithUserId);
    }
    
    // 3. Dietary preferences
    if (guestSession.dietary_preferences && Object.keys(guestSession.dietary_preferences).length > 0) {
      // Only insert if there's actual dietary preference data
      const dietaryData = guestSession.dietary_preferences;
      const hasValidData = dietaryData.dietary_style || 
                          (dietaryData.allergies && dietaryData.allergies.length > 0) ||
                          (dietaryData.intolerances && dietaryData.intolerances.length > 0) ||
                          (dietaryData.restrictions && dietaryData.restrictions.length > 0) ||
                          (dietaryData.preferred_foods && dietaryData.preferred_foods.length > 0) ||
                          (dietaryData.disliked_foods && dietaryData.disliked_foods.length > 0) ||
                          dietaryData.meal_frequency ||
                          dietaryData.cooking_skill_level ||
                          dietaryData.budget_range;
      
      if (hasValidData) {
        await supabase
          .from('user_dietary_preferences')
          .insert({
            user_id: user.id,
            ...dietaryData,
          });
      }
    }
    
    // 4. Routines and items
    if (guestSession.routines?.length > 0) {
      for (const guestRoutine of guestSession.routines) {
        // Insert routine
        const { data: newRoutine, error: routineError } = await supabase
          .from('user_routines')
          .insert({
            user_id: user.id,
            routine_name: guestRoutine.routine_name,
            description: guestRoutine.description,
            status: guestRoutine.status,
            schedule_type: 'weekly',
            schedule_config: { days_of_week: [guestRoutine.day_of_week] },
            time_of_day: guestRoutine.time_of_day,
          })
          .select('id')
          .single();
          
        if (routineError) {
          console.error('Error creating routine:', routineError);
          throw routineError;
        }
        
        if (!newRoutine || !newRoutine.id) {
          console.error('No routine ID returned from insert');
          throw new Error('Failed to create routine');
        }
        
        console.log('Created routine with ID:', newRoutine.id);
        
        // Insert items
        if (guestRoutine.items?.length > 0 && newRoutine && newRoutine.id) {
          console.log(`Migrating ${guestRoutine.items.length} items for routine ${newRoutine.id}`);
          
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(newRoutine.id)) {
            console.error('Invalid UUID format for routine ID:', newRoutine.id);
            throw new Error('Invalid routine ID format');
          }
          
          const itemsWithRoutineId = guestRoutine.items.map((item: any) => {
            // Remove any temporary IDs and let Supabase generate new UUIDs
            const { temp_item_id, id, ...itemData } = item;
            return {
              ...itemData,
              routine_id: newRoutine.id,
            };
          });
          
          console.log('Items to insert:', JSON.stringify(itemsWithRoutineId, null, 2));
          
          const { data: insertedItems, error: itemsError } = await supabase
            .from('routine_items')
            .insert(itemsWithRoutineId)
            .select();
            
          if (itemsError) {
            console.error('Error inserting routine items:', itemsError);
            throw itemsError;
          }
          
          console.log(`Successfully inserted ${insertedItems?.length || 0} routine items`);
        }
      }
    }
    
    // 5. Mark onboarding complete
    await supabase
      .from('user_profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    // 6. Mark session as migrated
    await supabase
      .from('guest_onboarding_sessions')
      .update({
        migrated: true,
        migrated_to_user_id: user.id,
      })
      .eq('session_id', guestSessionId);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error('Migration error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return Response.json({ 
      error: 'Migration failed', 
      details: error.message 
    }, { status: 500 });
  }
}
