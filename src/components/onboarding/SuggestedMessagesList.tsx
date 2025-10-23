'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import { getFilteredSuggestedMessages, SuggestedMessage } from './OnboardingSuggestedMessages';

interface SuggestedMessagesListProps {
  progressData: any;
  onMessageSelect: (message: string) => void;
  onDismiss: () => void;
}

export default function SuggestedMessagesList({ 
  progressData, 
  onMessageSelect, 
  onDismiss 
}: SuggestedMessagesListProps) {
  const [filteredMessages, setFilteredMessages] = useState<SuggestedMessage[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set());

  // Update filtered messages when progress data changes
  useEffect(() => {
    if (progressData) {
      const messages = getFilteredSuggestedMessages(progressData, dismissedMessages);
      setFilteredMessages(messages);
    }
  }, [progressData, dismissedMessages]);

  const handleMessageClick = (message: SuggestedMessage) => {
    onMessageSelect(message.text);
    // Add to dismissed messages to prevent showing it again immediately
    setDismissedMessages(prev => new Set(prev).add(message.id));
  };

  const handleDismiss = () => {
    onDismiss();
  };

  // Don't render if no messages or if all messages are dismissed
  if (filteredMessages.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 p-3 bg-muted/30 border border-muted rounded-lg animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Suggested Messages</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-2">
        {filteredMessages.map((message) => (
          <Button
            key={message.id}
            variant="secondary"
            size="sm"
            onClick={() => handleMessageClick(message)}
            className="w-full text-xs px-3 py-2 h-auto text-left justify-start hover:bg-secondary/80 bg-white border border-gray-200"
          >
            {message.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
