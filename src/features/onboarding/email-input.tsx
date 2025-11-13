'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmailInputProps {
  email: string;
  isComplete: boolean;
  onAnalyzeRoutine: () => void;
}

export default function EmailInput({ email, isComplete, onAnalyzeRoutine }: EmailInputProps) {
  const hasEmail = typeof email === 'string' && email.length > 0;

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-3">
        <Input
          value={email}
          readOnly
          placeholder="Email address"
          className="bg-background"
        />
        <Button 
          onClick={onAnalyzeRoutine}
          disabled={!hasEmail || !isComplete}
          className="w-full sm:w-auto"
        >
          Analyze Routine
        </Button>
      </div>
    </div>
  );
}

