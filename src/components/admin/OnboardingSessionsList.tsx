"use client";

import { useEffect, useMemo, useState } from 'react';
import { OnboardingSessionCard, SessionSummary } from './OnboardingSessionCard';
import { OnboardingSessionDetail } from './OnboardingSessionDetail';
import { Button } from '@/components/ui/button';

type ListResponse = {
  dataSource: 'guest_onboarding_sessions' | 'mastra';
  items: SessionSummary[];
  nextOffset: number;
  limit: number;
};

export default function OnboardingSessionsList() {
  const [items, setItems] = useState<SessionSummary[]>([]);
  const [offset, setOffset] = useState(0);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dataSource, setDataSource] = useState<'guest_onboarding_sessions' | 'mastra' | null>(null);

  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const load = async (reset = false) => {
    setLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const res = await fetch(`/api/admin/guest-onboarding/list?limit=${pageSize}&offset=${currentOffset}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json: ListResponse = await res.json();
      setDataSource(json.dataSource);
      setItems((prev) => (reset ? json.items : [...prev, ...json.items]));
      setOffset(json.nextOffset);
      setHasMore(json.items.length === pageSize);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerNote = useMemo(() => {
    if (dataSource === 'guest_onboarding_sessions') return null;
    if (dataSource === 'mastra') return 'Routine counts are unavailable in this environment.';
    return null;
  }, [dataSource]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Guest Onboarding Sessions</h2>
        {headerNote && <div className="text-sm text-muted-foreground">{headerNote}</div>}
      </div>

      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="flex flex-col gap-3">
          {items.map((it) => (
            <OnboardingSessionCard key={it.sessionId} session={it} onOpen={setOpenSessionId} />
          ))}
        </div>
      </div>

      <div className="flex justify-start">
        {hasMore && (
          <Button disabled={loading} onClick={() => load(false)}>
            {loading ? 'Loading…' : 'Load more'}
          </Button>
        )}
      </div>

      <OnboardingSessionDetail
        sessionId={openSessionId}
        open={!!openSessionId}
        onOpenChange={(o) => !o && setOpenSessionId(null)}
      />
    </div>
  );
}


