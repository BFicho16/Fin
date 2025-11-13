'use client';

import { useState, cloneElement, isValidElement, ReactElement } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import AuthenticatedChatInterface from '@/components/chat/authenticated-chat-interface';

interface ChatPageLayoutProps {
  contentComponent: React.ReactNode;
  userId: string;
  userEmail: string;
  contentTitle?: string;
  chatComponent?: React.ReactNode; // Optional override (for guest onboarding)
  isContentOpen?: boolean; // Optional external state control
  onContentOpenChange?: (open: boolean) => void; // Optional external state handler
}

export default function ChatPageLayout({
  contentComponent,
  userId,
  userEmail,
  contentTitle,
  chatComponent,
  isContentOpen: externalIsContentOpen,
  onContentOpenChange: externalOnContentOpenChange,
}: ChatPageLayoutProps) {
  const [internalIsContentOpen, setInternalIsContentOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isContentOpen = externalIsContentOpen !== undefined ? externalIsContentOpen : internalIsContentOpen;
  const setIsContentOpen = externalOnContentOpenChange || setInternalIsContentOpen;

  // Use provided chatComponent or default to AuthenticatedChatInterface
  // Note: chatComponent should already have onContentOpenChange prop passed from parent
  const chat = chatComponent || (
    <AuthenticatedChatInterface
      userId={userId}
      userEmail={userEmail}
      onContentOpenChange={setIsContentOpen}
    />
  );

  return (
    <>
      {/* Desktop: Two-column layout */}
      <div className="h-full flex flex-col lg:grid lg:grid-cols-2 gap-3 p-4">
        {/* Left Column - Chat Interface */}
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0">
            {chat}
          </div>
        </div>

        {/* Right Column - Content (desktop only) */}
        <div className="hidden lg:flex flex-col h-full min-h-0">
          <Card className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0">
              {contentComponent}
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile: Content in Sheet overlay */}
      <div className="lg:hidden">
        <Sheet open={isContentOpen} onOpenChange={setIsContentOpen}>
          <SheetContent
            side="right"
            className="w-full sm:w-[400px] p-0 transition-all duration-300 h-[100dvh]"
          >
            <SheetTitle className="sr-only">{contentTitle || 'Content'}</SheetTitle>
            <div className="h-full overflow-y-auto">
              {contentComponent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

