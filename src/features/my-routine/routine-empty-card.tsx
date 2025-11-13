'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, MessageSquare, FileText } from 'lucide-react';

export default function RoutineEmptyCard() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">No Routine Set Yet</CardTitle>
          <CardDescription className="text-sm mt-2">
            Create your personalized routine to get started on your wellness journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Chat with your AI coach</p>
                <p className="text-xs text-muted-foreground">
                  Ask your longevity coach to help create a personalized routine tailored to your goals and preferences.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
              <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Add manually</p>
                <p className="text-xs text-muted-foreground">
                  Create your routine directly using markdown formatting. This feature will be available soon.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

