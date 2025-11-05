import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

const ALLOWED_EMAILS = new Set([
  'gdcaplan@gmail.com',
  'brian.ficho@gmail.com',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !ALLOWED_EMAILS.has(user.email)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  const threadId = `guest-onboarding-${sessionId}`;

  // Fetch messages
  const { data: messages, error: messagesError } = await supabase
    .from('mastra_messages')
    .select('id, role, content, createdAt')
    .eq('thread_id', threadId)
    .order('createdAt', { ascending: true });

  if (messagesError) {
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  // Normalize message content to display plain text only
  function normalizeText(text: string): string {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  const normalizedMessagesAll = (messages ?? [])
    // Only user/assistant roles for display
    .filter((m: any) => m.role === 'user' || m.role === 'assistant' || m.role === 'human')
    .map((m: any) => {
    const content = typeof m.content === 'string' ? m.content : '';
      let text = content.trim();
      // Handle quoted JSON-string payloads like "" or "some text"
      if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('\"') && text.endsWith('\"'))) {
        try {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'string') {
            text = parsed.trim();
          }
        } catch {}
      }
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        const obj = JSON.parse(text);
        if (typeof obj === 'string') {
          text = obj.trim();
        } else if (obj && typeof obj === 'object') {
          if (typeof obj.content === 'string' && obj.content.trim()) {
            text = obj.content.trim();
          } else {
            const parts = Array.isArray(obj.parts) ? obj.parts : Array.isArray(obj?.message?.parts) ? obj.message.parts : [];
            const texts = parts.map((p: any) => (typeof p?.text === 'string' ? p.text : '')).filter(Boolean);
            text = texts.join(' ').trim();
          }
        }
      } catch {
        // fallback: try regex to extract any text fields
        const matches = Array.from(text.matchAll(/\"text\"\s*:\s*\"([\s\S]*?)\"/g)).map((m) => m[1]);
        const joined = matches.join(' ').trim();
        text = joined || '';
      }
    }
      return { id: m.id, role: (m.role === 'human' ? 'user' : m.role || '').toLowerCase(), content: m.content, createdAt: m.createdAt, text: normalizeText(text) };
    });

  // Drop messages with no readable text (e.g., empty user payloads)
  // Drop messages with no readable text and de-duplicate by role+text globally
  const seenByRoleText = new Set<string>();
  const deduped: any[] = [];
  for (const m of normalizedMessagesAll) {
    const text = normalizeText(m.text ?? '');
    if (!text) continue;
    const key = `${m.role}:${text}`;
    if (seenByRoleText.has(key)) continue;
    seenByRoleText.add(key);
    deduped.push(m);
  }
  const normalizedMessages = deduped;

  // Try to fetch routines from guest_onboarding_sessions
  let routines: any[] | null = null;
  try {
    const { data: sessionRow, error: sessionError } = await supabase
      .from('guest_onboarding_sessions')
      .select('routines')
      .eq('session_id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    routines = (sessionRow?.routines as any[]) ?? [];
  } catch (_err) {
    routines = null;
  }

  return Response.json({
    sessionId,
    threadId,
    messages: normalizedMessages,
    routines,
  }, { headers: { 'Cache-Control': 'no-store' } });
}


