"use client";

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

type Message = { id: string; role: string; content: string; createdAt: string; text?: string };

type DetailResponse = {
  sessionId: string;
  threadId: string;
  messages: Message[];
  routines: any[] | null;
};

type Props = {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OnboardingSessionDetail({ sessionId, open, onOpenChange }: Props) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!open || !sessionId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/guest-onboarding/detail/${sessionId}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, sessionId]);

  const totalRoutineItems = (data?.routines ?? [])
    .reduce((acc: number, r: any) => acc + ((r?.items?.length as number) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session {sessionId}</DialogTitle>
        </DialogHeader>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}

        {!loading && data && (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Thread</div>
              <div className="text-sm break-all">{data.threadId}</div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Messages</div>
                <div className="max-h-80 overflow-auto border rounded-md p-2 space-y-2">
                  {data.messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="text-xs text-muted-foreground">
                        {m.role} · {new Date(m.createdAt).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{m.text && m.text.trim().length > 0 ? m.text : m.content}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Routine items {data.routines ? `(${totalRoutineItems})` : '(N/A)'}</div>
                <div className="max-h-80 overflow-auto border rounded-md p-2 space-y-2">
                  {data.routines ? (
                    (data.routines as any[]).map((r: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <div className="text-xs text-muted-foreground">{r.routine_name ?? 'Routine'}</div>
                        <ul className="list-disc pl-5">
                          {(r.items ?? []).map((it: any, i: number) => (
                            <li key={i}>{it.item_name ?? it.name ?? 'Item'}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Routine data not available in this environment.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


