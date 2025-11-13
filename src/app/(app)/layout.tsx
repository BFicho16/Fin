import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageOverlayProvider } from '@/components/page-overlay';
import ChatPageLayout from '@/components/layouts/chat-page-layout';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <PageOverlayProvider>
      <div className="h-full bg-muted/50">
        <main className="h-full flex flex-col">
          <ChatPageLayout
            userId={user.id}
            userEmail={user.email || ''}
            contentComponent={children}
          />
        </main>
      </div>
    </PageOverlayProvider>
  );
}

