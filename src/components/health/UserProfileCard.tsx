'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { Edit3, Save, X, User, Calendar, Weight, Ruler, Activity, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UnitToggle } from '@/components/ui/unit-toggle';
import { useUnitSystem } from '@/lib/hooks/useUnitSystem';
import { 
  formatWeight, 
  formatHeight, 
  convertWeightToKg, 
  convertHeightToCm,
  parseImperialWeight,
  parseImperialHeight 
} from '@/lib/unitConversions';

interface UserProfile {
  id: string;
  email: string;
  birth_date?: string;
  gender?: string;
  activity_level?: string;
  created_at: string;
  updated_at: string;
}

interface HealthMetric {
  id: string;
  metric_type: string;
  value: number;
  unit: string;
  logged_at: string;
}

interface UserProfileCardProps {
  userId: string;
}

export default function UserProfileCard({ userId }: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<HealthMetric[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    birth_date: '',
    gender: '',
    activity_level: '',
  });
  const { unitSystem, toggleUnitSystem } = useUnitSystem();

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditForm({
          birth_date: data.profile.birth_date || '',
          gender: data.profile.gender || '',
          activity_level: data.profile.activity_level || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchCurrentMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/health-metrics/${userId}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setCurrentMetrics(data.metrics || []);
      }
    } catch (error) {
      console.error('Error fetching current metrics:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
    fetchCurrentMetrics();
  }, [fetchProfile, fetchCurrentMetrics]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onProfileUpdate: () => {
      fetchProfile();
    },
    onHealthMetricsUpdate: () => {
      fetchCurrentMetrics();
    }
  });

  // Helper function to get latest metric by type
  const getLatestMetric = (metricType: string) => {
    return currentMetrics.find(metric => metric.metric_type === metricType);
  };

  const handleSave = async () => {
    try {
      const updates = {
        birth_date: editForm.birth_date || null,
        gender: editForm.gender || null,
        activity_level: editForm.activity_level || null,
      };

      const response = await fetch(`/api/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    // Reset form with current profile values
    setEditForm({
      birth_date: profile?.birth_date || '',
      gender: profile?.gender || '',
      activity_level: profile?.activity_level || '',
    });
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Unable to load profile information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Your Profile
          </h3>
          <div className="flex items-center space-x-2">
            <UnitToggle 
              unitSystem={unitSystem} 
              onToggle={toggleUnitSystem}
            />
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="sm"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={handleSave}
                  variant="default"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium w-20">Birth Date:</span>
            {isEditing ? (
              <Input
                type="date"
                value={editForm.birth_date}
                onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                placeholder="Enter birth date"
                className="flex-1"
              />
            ) : (
              <span className="text-sm">
                {profile.birth_date 
                  ? new Date(profile.birth_date + 'T12:00:00').toLocaleDateString() 
                  : 'Not specified'
                }
              </span>
            )}
          </div>

          {/* Current Health Metrics Section */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Current Metrics</span>
            </div>
            
            <div className="space-y-2">
              {getLatestMetric('weight') && (
                <div className="flex items-center gap-3">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-20">Weight:</span>
                  <span className="text-sm">
                    {formatWeight(getLatestMetric('weight')?.value, unitSystem)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({new Date(getLatestMetric('weight')?.logged_at || '').toLocaleDateString()})
                    </span>
                  </span>
                </div>
              )}
              
              {getLatestMetric('height') && (
                <div className="flex items-center gap-3">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium w-20">Height:</span>
                  <span className="text-sm">
                    {formatHeight(getLatestMetric('height')?.value, unitSystem)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({new Date(getLatestMetric('height')?.logged_at || '').toLocaleDateString()})
                    </span>
                  </span>
                </div>
              )}
              
              {!getLatestMetric('weight') && !getLatestMetric('height') && (
                <div className="text-sm text-muted-foreground">
                  No health metrics logged yet. Use the chat to log your weight and height.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium w-20">Gender:</span>
            {isEditing ? (
              <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm capitalize">{profile.gender || 'Not specified'}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium w-20">Activity:</span>
            {isEditing ? (
              <Select value={editForm.activity_level} onValueChange={(value) => setEditForm({ ...editForm, activity_level: value })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                  <SelectItem value="extremely_active">Extremely Active</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm capitalize">
                {profile.activity_level ? profile.activity_level.replace('_', ' ') : 'Not specified'}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
