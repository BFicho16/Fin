'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  Activity, 
  Utensils, 
  Footprints, 
  Dumbbell, 
  Pill,
  Calendar,
  Target,
  BarChart3
} from 'lucide-react';

interface HealthMetric {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  logged_at: string;
}

interface Meal {
  id: string;
  meal_type: string;
  consumed_at: string;
  total_calories: number | null;
  foods: any;
}

interface Steps {
  id: string;
  steps_count: number;
  distance_miles: number | null;
  calories_burned: number | null;
  logged_date: string;
}

interface Exercise {
  id: string;
  exercise_type: string;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number | null;
  performed_at: string;
}

interface Supplement {
  id: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  taken_at: string;
}

interface HealthDashboardProps {
  userId: string;
}

export default function HealthDashboard({ userId }: HealthDashboardProps) {
  const [currentMetrics, setCurrentMetrics] = useState<HealthMetric[]>([]);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [todaySteps, setTodaySteps] = useState<Steps[]>([]);
  const [todayExercises, setTodayExercises] = useState<Exercise[]>([]);
  const [recentSupplements, setRecentSupplements] = useState<Supplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date().toISOString().split('T')[0] + 'T00:00:00';
      const endOfDay = new Date().toISOString().split('T')[0] + 'T23:59:59';

      // Fetch all data in parallel
      const [
        metricsResponse,
        mealsResponse,
        stepsResponse,
        exercisesResponse,
        supplementsResponse
      ] = await Promise.all([
        fetch(`/api/health-metrics/${userId}?limit=10`),
        fetch(`/api/meals/${userId}?start_date=${startOfDay}&end_date=${endOfDay}`),
        fetch(`/api/steps/${userId}?start_date=${today}&end_date=${today}`),
        fetch(`/api/exercises/${userId}?start_date=${startOfDay}&end_date=${endOfDay}`),
        fetch(`/api/supplements/${userId}?limit=5`)
      ]);

      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setCurrentMetrics(data.metrics || []);
      }

      if (mealsResponse.ok) {
        const data = await mealsResponse.json();
        setTodayMeals(data.meals || []);
      }

      if (stepsResponse.ok) {
        const data = await stepsResponse.json();
        setTodaySteps(data.steps || []);
      }

      if (exercisesResponse.ok) {
        const data = await exercisesResponse.json();
        setTodayExercises(data.exercises || []);
      }

      if (supplementsResponse.ok) {
        const data = await supplementsResponse.json();
        setRecentSupplements(data.supplements || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onHealthMetricsUpdate: () => {
      // Refetch metrics when they change
      fetch(`/api/health-metrics/${userId}?limit=10`)
        .then(res => res.json())
        .then(data => setCurrentMetrics(data.metrics || []))
        .catch(console.error);
    },
    onMealsUpdate: () => {
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date().toISOString().split('T')[0] + 'T00:00:00';
      const endOfDay = new Date().toISOString().split('T')[0] + 'T23:59:59';
      fetch(`/api/meals/${userId}?start_date=${startOfDay}&end_date=${endOfDay}`)
        .then(res => res.json())
        .then(data => setTodayMeals(data.meals || []))
        .catch(console.error);
    },
    onStepsUpdate: () => {
      const today = new Date().toISOString().split('T')[0];
      fetch(`/api/steps/${userId}?start_date=${today}&end_date=${today}`)
        .then(res => res.json())
        .then(data => setTodaySteps(data.steps || []))
        .catch(console.error);
    },
    onExercisesUpdate: () => {
      const startOfDay = new Date().toISOString().split('T')[0] + 'T00:00:00';
      const endOfDay = new Date().toISOString().split('T')[0] + 'T23:59:59';
      fetch(`/api/exercises/${userId}?start_date=${startOfDay}&end_date=${endOfDay}`)
        .then(res => res.json())
        .then(data => setTodayExercises(data.exercises || []))
        .catch(console.error);
    },
    onSupplementsUpdate: () => {
      fetch(`/api/supplements/${userId}?limit=5`)
        .then(res => res.json())
        .then(data => setRecentSupplements(data.supplements || []))
        .catch(console.error);
    }
  });

  const getLatestMetric = (metricType: string) => {
    return currentMetrics.find(metric => metric.metric_type === metricType);
  };

  const getTotalCalories = () => {
    return todayMeals.reduce((total, meal) => total + (meal.total_calories || 0), 0);
  };

  const getTotalSteps = () => {
    return todaySteps.reduce((total, steps) => total + steps.steps_count, 0);
  };

  const getTotalExerciseMinutes = () => {
    return todayExercises.reduce((total, exercise) => total + exercise.duration_minutes, 0);
  };

  const getTotalCaloriesBurned = () => {
    const stepsCalories = todaySteps.reduce((total, steps) => total + (steps.calories_burned || 0), 0);
    const exerciseCalories = todayExercises.reduce((total, exercise) => total + (exercise.calories_burned || 0), 0);
    return stepsCalories + exerciseCalories;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getLatestMetric('weight') ? (
              <div>
                <div className="text-2xl font-bold">
                  {getLatestMetric('weight')?.value} {getLatestMetric('weight')?.unit}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(getLatestMetric('weight')?.logged_at || '').toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No weight logged</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Height</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {getLatestMetric('height') ? (
              <div>
                <div className="text-2xl font-bold">
                  {getLatestMetric('height')?.value} {getLatestMetric('height')?.unit}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(getLatestMetric('height')?.logged_at || '').toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No height logged</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Steps</CardTitle>
            <Footprints className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalSteps().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {todaySteps.length > 0 ? 'Logged today' : 'No steps logged today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Consumed</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalCalories()}</div>
            <p className="text-xs text-muted-foreground">
              {todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''} logged today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Today's Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMeals.length > 0 ? (
              <div className="space-y-2">
                {todayMeals.map((meal) => (
                  <div key={meal.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="capitalize">{meal.meal_type}</span>
                    <span className="text-sm font-medium">
                      {meal.total_calories || 'N/A'} cal
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No meals logged today</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Today's Exercise
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayExercises.length > 0 ? (
              <div className="space-y-2">
                {todayExercises.map((exercise) => (
                  <div key={exercise.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{exercise.exercise_name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {exercise.exercise_type}
                      </div>
                    </div>
                    <div className="text-sm text-right">
                      <div>{exercise.duration_minutes} min</div>
                      {exercise.calories_burned && (
                        <div className="text-muted-foreground">{exercise.calories_burned} cal</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Total Time:</span>
                    <span className="font-medium">{getTotalExerciseMinutes()} min</span>
                  </div>
                  {getTotalCaloriesBurned() > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Calories Burned:</span>
                      <span className="font-medium">{getTotalCaloriesBurned()} cal</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No exercise logged today</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Recent Supplements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSupplements.length > 0 ? (
              <div className="space-y-2">
                {recentSupplements.map((supplement) => (
                  <div key={supplement.id} className="flex justify-between items-center p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{supplement.supplement_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {supplement.dosage} • {supplement.frequency}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(supplement.taken_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No supplements logged recently</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Today's Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getTotalSteps().toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{getTotalCalories()}</div>
              <div className="text-sm text-muted-foreground">Calories In</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{getTotalCaloriesBurned()}</div>
              <div className="text-sm text-muted-foreground">Calories Out</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{getTotalExerciseMinutes()}</div>
              <div className="text-sm text-muted-foreground">Exercise (min)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
