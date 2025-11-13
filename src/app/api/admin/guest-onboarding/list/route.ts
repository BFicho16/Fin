import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureSleepRoutineShape } from '@/lib/sleep-routine';
export const dynamic = 'force-dynamic';

const ALLOWED_EMAILS = new Set([
  'gdcaplan@gmail.com',
  'brian.ficho@gmail.com',
]);

type SessionListItem = {
  sessionId: string;
  createdAt: string | null;
  lastAccessed: string | null;
  messageCount: number; // user-sent messages only
  routineItemsCount: number | null;
};

function extractPlainText(content: string | null | undefined): string {
  if (!content) return '';
  const trimmed = content.trim();
  if (!trimmed) return '';
  // Handle quoted JSON-string payloads like "" or "some text"
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\"') && trimmed.endsWith('\"'))) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        return parsed.trim();
      }
    } catch {}
  }
  // Try JSON parse for Mastra structured content
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const obj = JSON.parse(trimmed);
      if (typeof obj === 'string') return obj.trim();
      if (obj && typeof obj === 'object') {
        // Prefer explicit content
        if (typeof obj.content === 'string' && obj.content.trim()) return obj.content.trim();
        // Join text parts if present
        const parts = Array.isArray(obj.parts) ? obj.parts : Array.isArray(obj?.message?.parts) ? obj.message.parts : [];
        const texts = parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).filter(Boolean);
        const joined = texts.join(' ').trim();
        if (joined) return joined;
      }
    } catch {
      // Fallback: attempt regex extraction of any text fields
      const matches = Array.from(trimmed.matchAll(/\"text\"\s*:\s*\"([\s\S]*?)\"/g)).map((m) => m[1]);
      const joined = matches.join(' ').trim();
      if (joined) return joined;
      // Treat as empty structured payload if no readable text found
      return '';
    }
  }
  return trimmed;
}

function normalizeText(text: string): string {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !ALLOWED_EMAILS.has(user.email)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);
  const offset = Math.max(Number(searchParams.get('offset') ?? '0'), 0);

  // Try primary source: guest_onboarding_sessions
  let dataSource: 'guest_onboarding_sessions' | 'mastra' = 'guest_onboarding_sessions';
  let items: SessionListItem[] = [];

  try {
    // Build ordered session ids that have at least 1 user message by inspecting mastra_messages
    const { data: recentUserMsgs, error: msgErr } = await supabase
      .from('mastra_messages')
      .select('thread_id, createdAt, content, role')
      .like('thread_id', 'guest-onboarding-%')
      .in('role', ['user', 'human'])
      .order('createdAt', { ascending: false })
      .limit(1000);

    if (msgErr) throw msgErr;

    // Only consider messages with non-empty extracted text
    const filteredMsgs = (recentUserMsgs ?? []).filter((m: any) => normalizeText(extractPlainText(m.content))?.length > 0);

    const seen = new Set<string>();
    const orderedSessionIds: string[] = [];
    for (const m of filteredMsgs) {
      const tid = (m as any).thread_id as string;
      const sid = tid.replace('guest-onboarding-', '');
      if (!seen.has(sid)) {
        seen.add(sid);
        orderedSessionIds.push(sid);
      }
    }

    const pagedSessionIds = orderedSessionIds.slice(offset, offset + limit);

    // Fetch sessions for these ids
    const { data: sessions, error } = await supabase
      .from('guest_onboarding_sessions')
      .select('session_id, created_at, last_accessed, sleep_routine')
      .in('session_id', pagedSessionIds);

    if (error) throw error;

    // Map for quick lookup
    const byId = new Map<string, any>((sessions ?? []).map((r: any) => [r.session_id, r]));

    const computedItems = await Promise.all(
      pagedSessionIds.map(async (sessionId) => {
        const row = byId.get(sessionId);
        const createdAt: string | null = row?.created_at ?? null;
        const lastAccessed: string | null = row?.last_accessed ?? null;
        const sleepRoutine = ensureSleepRoutineShape(row?.sleep_routine || {});
        const routineItemsCount =
          (sleepRoutine.night?.bedtime ? 1 : 0) +
          (sleepRoutine.morning?.wake_time ? 1 : 0) +
          (sleepRoutine.night?.pre_bed?.length || 0);

        // Count normalized, de-duplicated TOTAL messages (user/human + assistant)
        const { data: msgsForCount } = await supabase
          .from('mastra_messages')
          .select('content, role')
          .eq('thread_id', `guest-onboarding-${sessionId}`)
          .in('role', ['user', 'human', 'assistant'])
          .order('createdAt', { ascending: true })
          .limit(2000);
        const seenKeys = new Set<string>();
        const msgCount = (msgsForCount ?? []).reduce((acc, m: any) => {
          const text = normalizeText(extractPlainText(m.content));
          if (!text) return acc;
          const role = (m.role === 'human' ? 'user' : m.role || '').toLowerCase();
          const key = `${role}:${text}`;
          if (seenKeys.has(key)) return acc;
          seenKeys.add(key);
          return acc + 1;
        }, 0);

        // Ensure at least one USER/HUMAN message with text exists; otherwise exclude session
        const userTextExists = (msgsForCount ?? []).some((m: any) => {
          const role = (m.role === 'human' ? 'user' : m.role || '').toLowerCase();
          if (role !== 'user') return false;
          const text = normalizeText(extractPlainText(m.content));
          return !!text;
        });

        return {
          sessionId,
          createdAt,
          lastAccessed,
          messageCount: msgCount ?? 0,
          routineItemsCount,
          __include: userTextExists,
        } as SessionListItem & { __include: boolean };
      })
    );
    items = computedItems.filter((it) => (it as any).__include).map(({ __include, ...rest }) => rest as SessionListItem);
  } catch (err: any) {
    // Fallback to Mastra threads if the table doesn't exist or any unexpected error
    dataSource = 'mastra';

    // Fallback: build ordered unique session ids from user messages only
    const { data: recentUserMsgs, error: msgErr } = await supabase
      .from('mastra_messages')
      .select('thread_id, createdAt, content, role')
      .like('thread_id', 'guest-onboarding-%')
      .in('role', ['user', 'human'])
      .order('createdAt', { ascending: false })
      .limit(1000);

    if (msgErr) {
      return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const filteredMsgs = (recentUserMsgs ?? []).filter((m: any) => normalizeText(extractPlainText(m.content))?.length > 0);
    const seen = new Set<string>();
    const orderedSessionIds: string[] = [];
    for (const m of filteredMsgs) {
      const tid = (m as any).thread_id as string;
      const sid = tid.replace('guest-onboarding-', '');
      if (!seen.has(sid)) {
        seen.add(sid);
        orderedSessionIds.push(sid);
      }
    }

    const pagedSessionIds = orderedSessionIds.slice(offset, offset + limit);

    // Build items (without routines in fallback)
    const computedFallback = await Promise.all(
      pagedSessionIds.map(async (sessionId) => {
        const { data: firstMsg } = await supabase
          .from('mastra_messages')
          .select('createdAt')
          .eq('thread_id', `guest-onboarding-${sessionId}`)
          .order('createdAt', { ascending: true })
          .limit(1)
          .single();

        const { data: msgsForCount } = await supabase
          .from('mastra_messages')
          .select('content, role')
          .eq('thread_id', `guest-onboarding-${sessionId}`)
          .in('role', ['user', 'human', 'assistant'])
          .order('createdAt', { ascending: true })
          .limit(2000);
        const seenKeys = new Set<string>();
        const msgCount = (msgsForCount ?? []).reduce((acc, m: any) => {
          const text = normalizeText(extractPlainText(m.content));
          if (!text) return acc;
          const role = (m.role === 'human' ? 'user' : m.role || '').toLowerCase();
          const key = `${role}:${text}`;
          if (seenKeys.has(key)) return acc;
          seenKeys.add(key);
          return acc + 1;
        }, 0);

        const userTextExists = (msgsForCount ?? []).some((m: any) => {
          const role = (m.role === 'human' ? 'user' : m.role || '').toLowerCase();
          if (role !== 'user') return false;
          const text = normalizeText(extractPlainText(m.content));
          return !!text;
        });

        return {
          sessionId,
          createdAt: (firstMsg as any)?.createdAt ?? null,
          lastAccessed: null,
          messageCount: msgCount,
          routineItemsCount: null,
          __include: userTextExists,
        } as SessionListItem & { __include: boolean };
      })
    );
    items = computedFallback.filter((it) => (it as any).__include).map(({ __include, ...rest }) => rest as SessionListItem);
  }

  return Response.json({
    dataSource,
    items,
    nextOffset: offset + items.length,
    limit,
  }, { headers: { 'Cache-Control': 'no-store' } });
}


