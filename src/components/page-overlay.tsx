'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { ActivePageMetadata, OverlayState } from '@/lib/active-page';
import { resolveActivePage } from '@/lib/active-page';
import { navigationTargets } from '@/config/navigation-targets';

interface PageOverlayContextValue {
  overlayState: OverlayState;
  currentPage: ActivePageMetadata | null;
  setOverlayState: (state: OverlayState) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const PageOverlayContext = createContext<PageOverlayContextValue | undefined>(
  undefined
);

export function usePageOverlay() {
  const context = useContext(PageOverlayContext);
  if (!context) {
    // Return default values if not in provider context (e.g., guest pages)
    return {
      overlayState: {
        isOpen: false,
        type: null,
      },
      currentPage: null,
      setOverlayState: () => {},
      activeTab: 'my-routine',
      setActiveTab: () => {},
    };
  }
  return context;
}

export function PageOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [overlayState, setOverlayState] = useState<OverlayState>({
    isOpen: false,
    type: null,
  });
  const [activeTab, setActiveTab] = useState<string>('my-routine');

  const currentPage = useMemo(() => {
    const page = resolveActivePage(pathname, overlayState, navigationTargets);
    // Include activeTab in metadata when on root route
    if (pathname === '/') {
      return {
        ...page,
        metadata: {
          ...page.metadata,
          activeTab,
        },
      };
    }
    return page;
  }, [pathname, overlayState, activeTab]);

  return (
    <PageOverlayContext.Provider
      value={{
        overlayState,
        currentPage,
        setOverlayState,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </PageOverlayContext.Provider>
  );
}

