'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  Calendar, 
  Plus, 
  Edit, 
  Archive, 
  Trash2,
  Sun,
  Moon,
  Utensils,
  Dumbbell
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

interface RoutineItem {
  id: string;
  item_name: string;
  item_type: string;
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  distance_km?: number;
  calories?: number;
  serving_size?: string;
  notes?: string;
  item_order: number;
  is_optional: boolean;
  completed?: boolean;
}

interface Routine {
  id: string;
  routine_name: string;
  description?: string;
  status: 'pending' | 'active' | 'archived';
  schedule_type: 'weekly' | 'monthly' | 'yearly';
  schedule_config: {
    days_of_week?: number[];
    days_of_month?: number[];
    days_of_year?: string[];
  };
  time_of_day?: 'morning' | 'lunch' | 'night' | 'workout';
  created_at: string;
  updated_at: string;
  routine_items?: RoutineItem[];
}

interface MyRoutinesProps {
  userId: string;
}

export default function MyRoutines({ userId }: MyRoutinesProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');

  const fetchRoutines = useCallback(async () => {
    try {
      const response = await fetch(`/api/routines/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRoutines(data.routines || []);
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    }
  }, [userId]);

  const fetchTodayRoutines = useCallback(async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const dayOfMonth = today.getDate();
      const monthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const activeRoutines = routines.filter(routine => {
        if (routine.status !== 'active') return false;

        switch (routine.schedule_type) {
          case 'weekly':
            return routine.schedule_config.days_of_week?.includes(dayOfWeek);
          case 'monthly':
            return routine.schedule_config.days_of_month?.includes(dayOfMonth);
          case 'yearly':
            return routine.schedule_config.days_of_year?.includes(monthDay);
          default:
            return false;
        }
      });

      // Fetch routine items for today's routines
      const routinesWithItems = await Promise.all(
        activeRoutines.map(async (routine) => {
          const response = await fetch(`/api/routines/${userId}/${routine.id}`);
          if (response.ok) {
            const data = await response.json();
            return { ...routine, routine_items: data.routine.routine_items || [] };
          }
          return routine;
        })
      );

      setTodayRoutines(routinesWithItems);
    } catch (error) {
      console.error('Error fetching today routines:', error);
    }
  }, [routines, userId]);

  const fetchCompletions = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/routines/${userId}/completions?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        const completionMap: Record<string, boolean> = {};
        data.completions.forEach((completion: any) => {
          completionMap[completion.routine_item_id] = true;
        });
        setCompletions(completionMap);
      }
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchRoutines();
      setIsLoading(false);
    };
    loadData();
  }, [fetchRoutines]);

  useEffect(() => {
    if (routines.length > 0) {
      fetchTodayRoutines();
      fetchCompletions();
    }
  }, [routines, fetchTodayRoutines, fetchCompletions]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onRoutinesUpdate: () => {
      fetchRoutines();
    },
    onRoutineItemsUpdate: () => {
      fetchTodayRoutines();
    },
    onRoutineCompletionsUpdate: () => {
      fetchCompletions();
    }
  });

  const markItemComplete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/routines/${userId}/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routine_item_id: itemId,
          completion_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setCompletions(prev => ({
          ...prev,
          [itemId]: true
        }));
      }
    } catch (error) {
      console.error('Error marking item complete:', error);
    }
  };

  const getTimeOfDayIcon = (timeOfDay?: string) => {
    switch (timeOfDay) {
      case 'morning':
        return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'lunch':
        return <Utensils className="h-4 w-4 text-orange-500" />;
      case 'night':
        return <Moon className="h-4 w-4 text-blue-500" />;
      case 'workout':
        return <Dumbbell className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTimeOfDayLabel = (timeOfDay?: string) => {
    switch (timeOfDay) {
      case 'morning':
        return 'Morning';
      case 'lunch':
        return 'Lunch';
      case 'night':
        return 'Night';
      case 'workout':
        return 'Workout';
      default:
        return 'Any time';
    }
  };

  const getScheduleSummary = (routine: Routine) => {
    switch (routine.schedule_type) {
      case 'weekly':
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const weekDays = routine.schedule_config.days_of_week?.map(d => dayNames[d]).join(', ') || 'No days';
        return `Weekly: ${weekDays}`;
      case 'monthly':
        const monthDays = routine.schedule_config.days_of_month?.join(', ') || 'No days';
        return `Monthly: ${monthDays}`;
      case 'yearly':
        const dates = routine.schedule_config.days_of_year?.join(', ') || 'No dates';
        return `Yearly: ${dates}`;
      default:
        return 'No schedule';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'outline';
      case 'archived':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="all">All Routines</TabsTrigger>
      </TabsList>

      <TabsContent value="today" className="space-y-4">
        {todayRoutines.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No routines scheduled for today</p>
            <p className="text-sm mt-2">Create a routine or check your schedule settings!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayRoutines.map((routine) => (
              <Card key={routine.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getTimeOfDayIcon(routine.time_of_day)}
                    <h4 className="font-medium">{routine.routine_name}</h4>
                    <Badge variant="outline">
                      {getTimeOfDayLabel(routine.time_of_day)}
                    </Badge>
                  </div>
                </div>
                
                {routine.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {routine.description}
                  </p>
                )}

                <div className="space-y-2">
                  {routine.routine_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-2 rounded border"
                    >
                      <button
                        onClick={() => markItemComplete(item.id)}
                        disabled={completions[item.id]}
                        className="flex-shrink-0"
                      >
                        {completions[item.id] ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${completions[item.id] ? 'line-through text-muted-foreground' : ''}`}>
                            {item.item_name}
                          </span>
                          {item.is_optional && (
                            <Badge variant="outline" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.duration_minutes && `${item.duration_minutes} min`}
                          {item.sets && item.reps && ` • ${item.sets} sets × ${item.reps} reps`}
                          {item.weight_kg && ` • ${item.weight_kg}kg`}
                          {item.distance_km && ` • ${item.distance_km}km`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="all" className="space-y-4">
        {routines.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No routines yet</p>
            <p className="text-sm mt-2">Start a conversation with your health assistant to create your first routine!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Card key={routine.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTimeOfDayIcon(routine.time_of_day)}
                      <h4 className="font-medium">{routine.routine_name}</h4>
                      <Badge variant={getStatusVariant(routine.status) as any}>
                        {routine.status}
                      </Badge>
                    </div>
                    
                    {routine.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {routine.description}
                      </p>
                    )}
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      <div>{getScheduleSummary(routine)}</div>
                      {routine.time_of_day && (
                        <div>Time: {getTimeOfDayLabel(routine.time_of_day)}</div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {routine.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Archive className="h-4 w-4 mr-1" />
                          Archive
                        </Button>
                      )}
                      
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
