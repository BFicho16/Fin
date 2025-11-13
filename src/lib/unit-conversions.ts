/**
 * Unit conversion utilities for weight and height
 * 
 * Database stores data in SI units (kg and cm)
 * Frontend can display in either SI (default) or Imperial units
 */

export type UnitSystem = 'si' | 'imperial';

export interface WeightDisplay {
  value: number;
  unit: string;
}

export interface HeightDisplay {
  value: number;
  unit: string;
  inches?: number;
}

/**
 * Convert weight from kg (SI) to pounds (Imperial)
 */
export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

/**
 * Convert weight from pounds (Imperial) to kg (SI)
 */
export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

/**
 * Convert height from cm (SI) to feet and inches (Imperial)
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round((totalInches % 12) * 10) / 10; // Round to 1 decimal place
  return { feet, inches };
}

/**
 * Convert height from feet and inches (Imperial) to cm (SI)
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return totalInches * 2.54;
}

/**
 * Format weight for display based on unit system
 */
export function formatWeight(weightKg: number | null, unitSystem: UnitSystem = 'si'): string {
  if (!weightKg) return 'Not specified';
  
  if (unitSystem === 'imperial') {
    const lbs = kgToLbs(weightKg);
    return `${lbs.toFixed(1)} lbs`;
  }
  
  return `${weightKg.toFixed(1)} kg`;
}

/**
 * Format height for display based on unit system
 */
export function formatHeight(heightCm: number | null, unitSystem: UnitSystem = 'si'): string {
  if (!heightCm) return 'Not specified';
  
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}'${inches.toFixed(0)}"`;
  }
  
  return `${heightCm.toFixed(0)} cm`;
}

/**
 * Get weight display object for UI components
 */
export function getWeightDisplay(weightKg: number | null, unitSystem: UnitSystem = 'si'): WeightDisplay {
  if (!weightKg) {
    return { value: 0, unit: unitSystem === 'imperial' ? 'lbs' : 'kg' };
  }
  
  if (unitSystem === 'imperial') {
    return { value: kgToLbs(weightKg), unit: 'lbs' };
  }
  
  return { value: weightKg, unit: 'kg' };
}

/**
 * Get height display object for UI components
 */
export function getHeightDisplay(heightCm: number | null, unitSystem: UnitSystem = 'si'): HeightDisplay {
  if (!heightCm) {
    return { value: 0, unit: unitSystem === 'imperial' ? 'ft' : 'cm' };
  }
  
  if (unitSystem === 'imperial') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return { value: feet, unit: 'ft', inches: Math.round(inches) };
  }
  
  return { value: heightCm, unit: 'cm' };
}

/**
 * Convert input weight to kg for database storage
 * Assumes input is in the specified unit system
 */
export function convertWeightToKg(weight: number, fromUnitSystem: UnitSystem): number {
  if (fromUnitSystem === 'imperial') {
    return lbsToKg(weight);
  }
  return weight; // Already in kg
}

/**
 * Convert input height to cm for database storage
 * Assumes input is in the specified unit system
 */
export function convertHeightToCm(height: number, fromUnitSystem: UnitSystem): number {
  if (fromUnitSystem === 'imperial') {
    // For imperial, we need to handle feet + inches
    // This function assumes height is in inches total
    return height * 2.54;
  }
  return height; // Already in cm
}

/**
 * Parse imperial height input (e.g., "5'8" or "5 8") to inches
 */
export function parseImperialHeight(heightInput: string): number {
  const cleanInput = heightInput.replace(/['"]/g, ' ').trim();
  const parts = cleanInput.split(/\s+/);
  
  if (parts.length >= 2) {
    const feet = parseFloat(parts[0]);
    const inches = parseFloat(parts[1]);
    return feet * 12 + inches;
  }
  
  // If only one number, assume it's inches
  return parseFloat(parts[0]) || 0;
}

/**
 * Parse imperial weight input to pounds
 */
export function parseImperialWeight(weightInput: string): number {
  return parseFloat(weightInput.replace(/[^\d.]/g, '')) || 0;
}
