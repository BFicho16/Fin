'use client';

import { useState, useEffect } from 'react';

export function useMobileKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    const initialHeight = window.visualViewport?.height || window.innerHeight;
    setViewportHeight(initialHeight);

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Consider keyboard open if viewport height decreased by more than 150px
      const keyboardOpen = heightDifference > 150;
      
      setIsKeyboardOpen(keyboardOpen);
      setViewportHeight(currentHeight);
    };

    // Use Visual Viewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return { isKeyboardOpen, viewportHeight };
}
