'use client';

import { useState, useEffect } from 'react';
import { UnitSystem } from '../unitConversions';

const UNIT_SYSTEM_KEY = 'unit-system-preference';

/**
 * Custom hook for managing unit system preference
 * Defaults to SI units, allows switching to Imperial
 */
export function useUnitSystem() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('si');

  useEffect(() => {
    // Load preference from localStorage on mount
    const saved = localStorage.getItem(UNIT_SYSTEM_KEY);
    if (saved === 'imperial' || saved === 'si') {
      setUnitSystem(saved);
    }
  }, []);

  const toggleUnitSystem = () => {
    const newSystem: UnitSystem = unitSystem === 'si' ? 'imperial' : 'si';
    setUnitSystem(newSystem);
    localStorage.setItem(UNIT_SYSTEM_KEY, newSystem);
  };

  const setUnitSystemPreference = (system: UnitSystem) => {
    setUnitSystem(system);
    localStorage.setItem(UNIT_SYSTEM_KEY, system);
  };

  return {
    unitSystem,
    toggleUnitSystem,
    setUnitSystemPreference,
    isImperial: unitSystem === 'imperial',
    isSI: unitSystem === 'si',
  };
}
