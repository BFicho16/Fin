import { 
  BarChart3, 
  User, 
  Target, 
  FileText, 
  Activity, 
  TrendingUp 
} from 'lucide-react';
import HealthDashboard from './HealthDashboard';
import UserProfileCard from './UserProfileCard';
import GoalsPanel from './GoalsPanel';
import WellnessPlanViewer from './WellnessPlanViewer';
import ActivityLogger from './ActivityLogger';
import HealthMetricsChart from './HealthMetricsChart';

export interface DashboardSection {
  id: string;
  title: string;
  component: React.ComponentType<{ userId: string }>;
  defaultExpanded: boolean;
  order: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const dashboardSections: DashboardSection[] = [
  {
    id: 'overview',
    title: 'Health Overview',
    component: HealthDashboard,
    defaultExpanded: true,
    order: 1,
    icon: BarChart3
  },
  {
    id: 'profile',
    title: 'Your Profile',
    component: UserProfileCard,
    defaultExpanded: false,
    order: 2,
    icon: User
  },
  {
    id: 'goals',
    title: 'Your Goals',
    component: GoalsPanel,
    defaultExpanded: false,
    order: 3,
    icon: Target
  },
  {
    id: 'plans',
    title: 'Wellness Plans',
    component: WellnessPlanViewer,
    defaultExpanded: false,
    order: 4,
    icon: FileText
  },
  {
    id: 'activity',
    title: 'Log Activity',
    component: ActivityLogger,
    defaultExpanded: false,
    order: 5,
    icon: Activity
  },
  {
    id: 'metrics',
    title: 'Health Trends',
    component: HealthMetricsChart,
    defaultExpanded: false,
    order: 6,
    icon: TrendingUp
  }
];

// Helper function to get sections in order
export const getOrderedSections = (): DashboardSection[] => {
  return [...dashboardSections].sort((a, b) => a.order - b.order);
};

// Helper function to get section by ID
export const getSectionById = (id: string): DashboardSection | undefined => {
  return dashboardSections.find(section => section.id === id);
};
