'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Utensils, 
  Footprints, 
  Dumbbell, 
  Pill,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ActivityLoggerProps {
  userId: string;
}

export default function ActivityLogger({ userId }: ActivityLoggerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for different activities
  const [healthMetric, setHealthMetric] = useState({
    metric_type: 'weight',
    value: '',
    unit: 'lbs',
    notes: ''
  });

  const [meal, setMeal] = useState({
    meal_type: 'breakfast',
    foods: [{ name: '', calories: 0, amount: '' }],
    total_calories: '',
    notes: ''
  });

  const [steps, setSteps] = useState({
    steps_count: '',
    distance_miles: '',
    calories_burned: '',
    logged_date: new Date().toISOString().split('T')[0]
  });

  const [exercise, setExercise] = useState({
    exercise_type: 'cardio',
    exercise_name: '',
    duration_minutes: '',
    intensity_level: 'moderate',
    calories_burned: '',
    notes: ''
  });

  const [supplement, setSupplement] = useState({
    item_name: '',
    serving_size: '',
    notes: ''
  });

  const handleSubmit = async (endpoint: string, data: any) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let response;
      
      if (endpoint === 'supplements') {
        // For supplements, create a routine item instead of using the supplements API
        // First, we need to get or create a supplements routine
        const routineResponse = await fetch(`/api/routines/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!routineResponse.ok) {
          throw new Error('Failed to fetch routines');
        }
        
        const routines = await routineResponse.json();
        let supplementsRoutine = routines.routines?.find((r: any) => r.routine_name === 'Daily Supplements');
        
        if (!supplementsRoutine) {
          // Create a supplements routine if it doesn't exist
          const createRoutineResponse = await fetch(`/api/routines/${userId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              routine_name: 'Daily Supplements',
              description: 'Daily supplement intake tracking',
              status: 'active',
              schedule_type: 'weekly',
              schedule_config: { days_of_week: [0, 1, 2, 3, 4, 5, 6] },
              time_of_day: 'morning'
            }),
          });
          
          if (!createRoutineResponse.ok) {
            throw new Error('Failed to create supplements routine');
          }
          
          const newRoutine = await createRoutineResponse.json();
          supplementsRoutine = newRoutine.routine;
        }
        
        // Now add the supplement as a routine item
        response = await fetch(`/api/routines/${userId}/${supplementsRoutine.id}/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_name: data.item_name,
            item_type: 'supplement',
            serving_size: data.serving_size,
            notes: data.notes,
            habit_classification: 'good'
          }),
        });
      } else {
        // For other endpoints, use the original logic
        response = await fetch(`/api/${endpoint}/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: 'Activity logged successfully!' });
        // Reset form after successful submission
        setTimeout(() => setSubmitStatus(null), 3000);
      } else {
        const error = await response.json();
        setSubmitStatus({ type: 'error', message: error.error || 'Failed to log activity' });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addFoodItem = () => {
    setMeal(prev => ({
      ...prev,
      foods: [...prev.foods, { name: '', calories: 0, amount: '' }]
    }));
  };

  const updateFoodItem = (index: number, field: string, value: string | number) => {
    setMeal(prev => ({
      ...prev,
      foods: prev.foods.map((food, i) => 
        i === index ? { ...food, [field]: value } : food
      )
    }));
  };

  const removeFoodItem = (index: number) => {
    setMeal(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4" />
          Log Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics" className="flex items-center gap-1">
              <Activity className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="meals" className="flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Meals</span>
            </TabsTrigger>
            <TabsTrigger value="steps" className="flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Steps</span>
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Exercise</span>
            </TabsTrigger>
            <TabsTrigger value="supplements" className="flex items-center gap-1">
              <Pill className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">Supplements</span>
            </TabsTrigger>
          </TabsList>

          {/* Health Metrics Tab */}
          <TabsContent value="metrics" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Metric Type</label>
                <Select value={healthMetric.metric_type} onValueChange={(value) => setHealthMetric(prev => ({ ...prev, metric_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="height">Height</SelectItem>
                    <SelectItem value="body_fat_percentage">Body Fat %</SelectItem>
                    <SelectItem value="muscle_mass">Muscle Mass</SelectItem>
                    <SelectItem value="bmi">BMI</SelectItem>
                    <SelectItem value="waist_circumference">Waist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Unit</label>
                <Select value={healthMetric.unit} onValueChange={(value) => setHealthMetric(prev => ({ ...prev, unit: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">lbs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="inches">inches</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Value</label>
              <Input
                type="number"
                step="0.1"
                value={healthMetric.value}
                onChange={(e) => setHealthMetric(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={healthMetric.notes}
                onChange={(e) => setHealthMetric(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                rows={1}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('health-metrics', healthMetric)}
              disabled={isSubmitting || !healthMetric.value}
              className="w-full"
            >
              {isSubmitting ? 'Logging...' : 'Log Health Metric'}
            </Button>
          </TabsContent>

          {/* Meals Tab */}
          <TabsContent value="meals" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Meal Type</label>
                <Select value={meal.meal_type} onValueChange={(value) => setMeal(prev => ({ ...prev, meal_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="midday">Midday</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Total Calories</label>
                <Input
                  type="number"
                  value={meal.total_calories}
                  onChange={(e) => setMeal(prev => ({ ...prev, total_calories: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium">Food Items</label>
              <div className="space-y-1.5">
                {meal.foods.map((food, index) => (
                  <div key={index} className="flex gap-1.5">
                    <Input
                      placeholder="Food name"
                      value={food.name}
                      onChange={(e) => updateFoodItem(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Calories"
                      value={food.calories}
                      onChange={(e) => updateFoodItem(index, 'calories', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Input
                      placeholder="Amount"
                      value={food.amount}
                      onChange={(e) => updateFoodItem(index, 'amount', e.target.value)}
                      className="w-20"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFoodItem(index)}
                      disabled={meal.foods.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addFoodItem} className="w-full">
                  + Add Food Item
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={meal.notes}
                onChange={(e) => setMeal(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this meal..."
                rows={1}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('meals', meal)}
              disabled={isSubmitting || meal.foods.some(f => !f.name)}
              className="w-full"
            >
              {isSubmitting ? 'Logging...' : 'Log Meal'}
            </Button>
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps" className="space-y-3">
            <div>
              <label className="text-xs font-medium">Steps Count</label>
              <Input
                type="number"
                value={steps.steps_count}
                onChange={(e) => setSteps(prev => ({ ...prev, steps_count: e.target.value }))}
                placeholder="Enter number of steps"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Distance (miles)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={steps.distance_miles}
                  onChange={(e) => setSteps(prev => ({ ...prev, distance_miles: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Calories Burned</label>
                <Input
                  type="number"
                  value={steps.calories_burned}
                  onChange={(e) => setSteps(prev => ({ ...prev, calories_burned: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Date</label>
              <Input
                type="date"
                value={steps.logged_date}
                onChange={(e) => setSteps(prev => ({ ...prev, logged_date: e.target.value }))}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('steps', steps)}
              disabled={isSubmitting || !steps.steps_count}
              className="w-full"
            >
              {isSubmitting ? 'Logging...' : 'Log Steps'}
            </Button>
          </TabsContent>

          {/* Exercise Tab */}
          <TabsContent value="exercise" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Exercise Type</label>
                <Select value={exercise.exercise_type} onValueChange={(value) => setExercise(prev => ({ ...prev, exercise_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="pilates">Pilates</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium">Intensity</label>
                <Select value={exercise.intensity_level} onValueChange={(value) => setExercise(prev => ({ ...prev, intensity_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Exercise Name</label>
              <Input
                value={exercise.exercise_name}
                onChange={(e) => setExercise(prev => ({ ...prev, exercise_name: e.target.value }))}
                placeholder="e.g., Morning Run, Weight Training"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={exercise.duration_minutes}
                  onChange={(e) => setExercise(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  placeholder="30"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Calories Burned</label>
                <Input
                  type="number"
                  value={exercise.calories_burned}
                  onChange={(e) => setExercise(prev => ({ ...prev, calories_burned: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={exercise.notes}
                onChange={(e) => setExercise(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How did it feel? Any notes about the workout..."
                rows={1}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('exercises', exercise)}
              disabled={isSubmitting || !exercise.exercise_name || !exercise.duration_minutes}
              className="w-full"
            >
              {isSubmitting ? 'Logging...' : 'Log Exercise'}
            </Button>
          </TabsContent>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-3">
            <div>
              <label className="text-xs font-medium">Supplement Name</label>
              <Input
                value={supplement.item_name}
                onChange={(e) => setSupplement(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="e.g., Vitamin D, Protein Powder"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Dosage</label>
              <Input
                value={supplement.serving_size}
                onChange={(e) => setSupplement(prev => ({ ...prev, serving_size: e.target.value }))}
                placeholder="e.g., 1000 IU, 1 scoop"
              />
            </div>
            <div>
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={supplement.notes}
                onChange={(e) => setSupplement(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about this supplement..."
                rows={1}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('supplements', supplement)}
              disabled={isSubmitting || !supplement.item_name || !supplement.serving_size}
              className="w-full"
            >
              {isSubmitting ? 'Logging...' : 'Log Supplement Intake'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Status Message */}
        {submitStatus && (
          <div className={`mt-4 p-3 rounded-md flex items-center gap-2 ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {submitStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{submitStatus.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
