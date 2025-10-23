import { 
  User, 
  Activity, 
  Target, 
  Utensils, 
  Calendar, 
  Heart,
  CheckCircle,
  Circle
} from 'lucide-react';

export interface OnboardingCategory {
  id: string;
  label: string;
  description: string;
  icon: any;
  required: boolean;
  multipleItems: boolean;
  checkCompletion: (data: any) => boolean;
  fetchEndpoint: (userId: string) => string;
  getDisplayData?: (data: any) => { count: number; items: string[] };
}

export const onboardingCategories: Record<string, OnboardingCategory> = {
  demographics: {
    id: 'demographics',
    label: 'Demographics',
    description: 'Age and gender',
    icon: User,
    required: true,
    multipleItems: false,
    checkCompletion: (data) => {
      return data?.profile?.birth_date && data?.profile?.gender;
    },
    fetchEndpoint: (userId) => `/api/profile/${userId}`,
  },
  
  healthMetrics: {
    id: 'healthMetrics',
    label: 'Health Metrics',
    description: 'Current weight and height measurements',
    icon: Heart,
    required: true,
    multipleItems: false,
    checkCompletion: (data) => {
      const metrics = data?.metrics || [];
      const hasWeight = metrics.some((metric: any) => metric.metric_type === 'weight');
      const hasHeight = metrics.some((metric: any) => metric.metric_type === 'height');
      return hasWeight && hasHeight;
    },
    fetchEndpoint: (userId) => `/api/health-metrics/${userId}?limit=10`,
  },
  
  dietaryPreferences: {
    id: 'dietaryPreferences',
    label: 'Dietary Restrictions',
    description: 'Allergies, food you don\'t eat, etc.',
    icon: Utensils,
    required: false,
    multipleItems: true,
    checkCompletion: (data) => {
      const preferences = data?.preferences || [];
      return preferences.length > 0;
    },
    fetchEndpoint: (userId) => `/api/dietary-preferences/${userId}`,
    getDisplayData: (data) => {
      const preferences = data?.preferences || [];
      return {
        count: preferences.length,
        items: preferences.map((pref: any) => pref.preference_type)
      };
    },
  },
  
  routines: {
    id: 'routines',
    label: 'Weekly Routines',
    description: 'Morning and night routines for all 7 days',
    icon: Calendar,
    required: true,
    multipleItems: true,
    checkCompletion: (data) => {
      const routines = data?.routines || [];
      const activeRoutines = routines.filter((routine: any) => routine.status === 'active');
      
      // Check each day (0-6) has at least 1 morning and 1 night item
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
      return daysOfWeek.every(day => {
        const morningRoutine = activeRoutines.find((r: any) => 
          r.time_of_day === 'morning' && 
          r.schedule_config?.days_of_week?.includes(day)
        );
        const nightRoutine = activeRoutines.find((r: any) => 
          r.time_of_day === 'night' && 
          r.schedule_config?.days_of_week?.includes(day)
        );
        
        const morningHasItems = morningRoutine?.routine_items?.length > 0;
        const nightHasItems = nightRoutine?.routine_items?.length > 0;
        
        return morningHasItems && nightHasItems;
      });
    },
    fetchEndpoint: (userId) => `/api/routines/${userId}`,
    getDisplayData: (data) => {
      const routines = data?.routines || [];
      const activeRoutines = routines.filter((routine: any) => routine.status === 'active');
      
      // Count days with both morning and night routines
      const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
      const completeDays = daysOfWeek.filter(day => {
        const morningRoutine = activeRoutines.find((r: any) => 
          r.time_of_day === 'morning' && 
          r.schedule_config?.days_of_week?.includes(day)
        );
        const nightRoutine = activeRoutines.find((r: any) => 
          r.time_of_day === 'night' && 
          r.schedule_config?.days_of_week?.includes(day)
        );
        
        const morningHasItems = morningRoutine?.routine_items?.length > 0;
        const nightHasItems = nightRoutine?.routine_items?.length > 0;
        
        return morningHasItems && nightHasItems;
      }).length;
      
      return {
        count: completeDays,
        items: [`${completeDays}/7 days complete`]
      };
    },
  },
};

export const getRequiredCategories = () => {
  return Object.values(onboardingCategories).filter(category => category.required);
};

export const getAllCategories = () => {
  return Object.values(onboardingCategories);
};

export const getCategoryById = (id: string) => {
  return onboardingCategories[id];
};
