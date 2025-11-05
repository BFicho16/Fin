"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SessionSummary = {
  sessionId: string;
  createdAt: string | null;
  lastAccessed: string | null;
  messageCount: number;
  routineItemsCount: number | null;
};

type Props = {
  session: SessionSummary;
  onOpen: (sessionId: string) => void;
  className?: string;
};

export function OnboardingSessionCard({ session, onOpen, className }: Props) {
  const { sessionId, createdAt, lastAccessed, messageCount, routineItemsCount } = session;
  const displayId = sessionId.length > 16
    ? `${sessionId.slice(0, 8)}…${sessionId.slice(-6)}`
    : sessionId;

  const last = lastAccessed ?? createdAt;
  const lastLabel = last ? new Date(last).toLocaleString() : 'Unknown';

  return (
    <Card className={cn('hover:border-primary/40 transition-colors', className)}>
      <CardContent className="py-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="min-w-[170px] font-medium text-foreground">Session {displayId}</div>
          <div className="flex-1 text-muted-foreground">Last activity: <span className="text-foreground">{lastLabel}</span></div>
          <div className="w-[120px] text-muted-foreground">Messages: <span className="text-foreground">{messageCount}</span></div>
          <div className="w-[170px] text-muted-foreground">Routine items: <span className="text-foreground">{routineItemsCount ?? 'N/A'}</span></div>
          <div className="ml-auto">
            <Button size="sm" onClick={() => onOpen(sessionId)}>View</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


