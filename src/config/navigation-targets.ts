export interface NavigationTarget {
  id: string;
  route: string;
  title: string;
  icon?: string;
  description?: string;
}

export const navigationTargets: NavigationTarget[] = [
  {
    id: 'home',
    route: '/',
    title: 'Home',
    icon: 'Home',
    description: 'Main app with feature tabs',
  },
  {
    id: 'admin',
    route: '/admin',
    title: 'Admin Panel',
    icon: 'Settings',
    description: 'Administrative tools and user management',
  },
];

