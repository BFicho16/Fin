'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

export default function RoutineEmptyCard() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="max-w-lg w-full border-0 shadow-none">
        <CardHeader className="text-center py-6">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Create Your Routine</CardTitle>
          <CardDescription className="text-sm mt-4">
            Talk to your longevity agent and share your habits and routines so your agent can start 
            making personalized recommendations
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}


