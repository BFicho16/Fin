'use client';

import { Button } from '@/components/ui/button';
import { UnitSystem } from '@/lib/unitConversions';

interface UnitToggleProps {
  unitSystem: UnitSystem;
  onToggle: () => void;
  className?: string;
}

export function UnitToggle({ unitSystem, onToggle, className }: UnitToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={`text-xs ${className}`}
      title={`Switch to ${unitSystem === 'si' ? 'Imperial' : 'SI'} units`}
    >
      {unitSystem === 'si' ? 'SI' : 'Imperial'}
    </Button>
  );
}
