'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { Edit3, Save, X, User, Calendar, Cake } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  id: string;
  email: string;
  birth_date?: string;
  gender?: string;
  created_at: string;
  updated_at: string;
}


interface UserProfileCardProps {
  userId: string;
  embedded?: boolean; // When true, don't render the outer Card wrapper
}

export default function UserProfileCard({ userId, embedded = false }: UserProfileCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    birth_date: '',
    gender: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setEditForm({
          birth_date: data.profile.birth_date || '',
          gender: data.profile.gender || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onProfileUpdate: () => {
      fetchProfile();
    }
  });


  const handleSave = async () => {
    try {
      const updates = {
        birth_date: editForm.birth_date || null,
        gender: editForm.gender || null,
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
    });
    setIsEditing(false);
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate + 'T12:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    const loadingContent = (
      <>
        {!embedded && (
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
        )}
        <CardContent className={embedded ? "p-0" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </>
    );

    return embedded ? loadingContent : <Card>{loadingContent}</Card>;
  }

  if (!profile) {
    const errorContent = (
      <CardContent className={embedded ? "p-0" : "p-3"}>
        <p className="text-muted-foreground text-xs">Unable to load profile information.</p>
      </CardContent>
    );

    return embedded ? errorContent : <Card>{errorContent}</Card>;
  }

  const content = (
    <>
      {!embedded && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center">
              <User className="h-4 w-4 mr-1.5" />
              Your Profile
            </h3>
            <div className="flex items-center space-x-1.5">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                  size="sm"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-1.5">
                  <Button
                    onClick={handleSave}
                    variant="default"
                    size="sm"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className={embedded ? "p-0" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Age/Birth Date Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <h4 className="text-xs font-medium">Age</h4>
              <Cake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })}
                  placeholder="Enter birth date"
                  className="w-full"
                />
              ) : (
                <div>
                  {profile.birth_date ? (
                    <>
                      <div className="text-xl font-bold">
                        {calculateAge(profile.birth_date)} years old
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Born {new Date(profile.birth_date + 'T12:00:00').toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Birth date not specified</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gender Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <h4 className="text-xs font-medium">Gender</h4>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                  <SelectTrigger className="w-full">
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
                <div>
                  <div className="text-xl font-bold capitalize">
                    {profile.gender || 'Not specified'}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {profile.gender ? 'Gender identity' : 'No gender specified'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </>
  );

  return embedded ? content : <Card>{content}</Card>;
}
