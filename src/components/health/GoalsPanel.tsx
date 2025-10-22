'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { Target, Plus, Edit3, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Goal {
  id: string;
  goal_type: string;
  goal_description?: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
  priority: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface GoalsPanelProps {
  userId: string;
}

export default function GoalsPanel({ userId }: GoalsPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_type: '',
    goal_description: '',
    target_value: '',
    target_unit: '',
    target_date: '',
    priority: 1,
  });

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch(`/api/goals/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onGoalsUpdate: () => {
      fetchGoals();
    }
  });

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const goalData = {
        goal_type: newGoal.goal_type,
        goal_description: newGoal.goal_description || undefined,
        target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : undefined,
        target_unit: newGoal.target_unit || undefined,
        target_date: newGoal.target_date || undefined,
        priority: newGoal.priority,
        status: 'active' as const,
      };

      const response = await fetch(`/api/goals/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(prev => [data.goal, ...prev]);
        setNewGoal({
          goal_type: '',
          goal_description: '',
          target_value: '',
          target_unit: '',
          target_date: '',
          priority: 1,
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'active':
        return 'secondary';
      case 'paused':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center">
            <Target className="h-4 w-4 mr-1.5" />
            Your Goals
          </h3>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select value={newGoal.goal_type} onValueChange={(value) => setNewGoal({ ...newGoal, goal_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="longevity">Longevity</SelectItem>
                      <SelectItem value="general_health">General Health</SelectItem>
                      <SelectItem value="sports_performance">Sports Performance</SelectItem>
                      <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newGoal.priority.toString()} onValueChange={(value) => setNewGoal({ ...newGoal, priority: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">High (1)</SelectItem>
                      <SelectItem value="2">Medium-High (2)</SelectItem>
                      <SelectItem value="3">Medium (3)</SelectItem>
                      <SelectItem value="4">Medium-Low (4)</SelectItem>
                      <SelectItem value="5">Low (5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal_description">Description</Label>
                  <Textarea
                    id="goal_description"
                    value={newGoal.goal_description}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_description: e.target.value })}
                    placeholder="Describe your goal in detail..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      id="target_value"
                      type="number"
                      step="0.1"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                      placeholder="e.g., 20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target_unit">Target Unit</Label>
                    <Input
                      id="target_unit"
                      value={newGoal.target_unit}
                      onChange={(e) => setNewGoal({ ...newGoal, target_unit: e.target.value })}
                      placeholder="e.g., kg, pounds"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add Goal</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center text-muted-foreground py-6">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">No goals yet</p>
            <p className="text-xs mt-1.5">Add your first health goal to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <Card key={goal.id} className="p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5 mb-1.5">
                      {getStatusIcon(goal.status)}
                      <h4 className="font-medium capitalize text-xs">
                        {goal.goal_type.replace('_', ' ')}
                      </h4>
                      <Badge variant={getStatusVariant(goal.status) as any} className="text-[10px]">
                        {goal.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Priority {goal.priority}
                      </Badge>
                    </div>
                    
                    {goal.goal_description && (
                      <p className="text-xs text-muted-foreground mb-1.5">{goal.goal_description}</p>
                    )}
                    
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      {goal.target_value && (
                        <span>
                          Target: {goal.target_value} {goal.target_unit || ''}
                        </span>
                      )}
                      {goal.target_date && (
                        <span>
                          By: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}