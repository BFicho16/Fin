import type { NavigationTarget } from '@/config/navigation-targets';

export interface ActivePageMetadata {
  route: string;
  title: string;
  icon?: string;
  link: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface OverlayState {
  isOpen: boolean;
  type: 'drawer' | 'modal' | 'sheet' | null;
  content?: string;
}

export function resolveActivePage(
  route: string,
  overlayState: OverlayState,
  navigationTargets: NavigationTarget[]
): ActivePageMetadata {
  // If overlay is open, return overlay content from navigation targets
  if (overlayState.isOpen && overlayState.content) {
    const overlayTarget = navigationTargets.find(
      (target) => target.id === overlayState.content
    );
    if (overlayTarget) {
      return {
        route: overlayTarget.route,
        title: overlayTarget.title,
        icon: overlayTarget.icon,
        link: overlayTarget.route,
      };
    }
  }

  // Otherwise, resolve from route
  const target = navigationTargets.find((target) => target.route === route);
  if (target) {
    return {
      route: target.route,
      title: target.title,
      icon: target.icon,
      link: target.route,
    };
  }

  // Fallback
  return {
    route,
    title: 'Page',
    link: route,
  };
}

