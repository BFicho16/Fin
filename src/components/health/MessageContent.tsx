'use client';

import ReactMarkdown from 'react-markdown';
import { LinkPreview } from '@/components/ui/link-preview';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  // Extract URLs from the content using regex
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlRegex) || [];
  
  // Split content by URLs to render text and links separately
  const parts = content.split(urlRegex);
  
  return (
    <div className="text-sm">
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (urls.includes(part)) {
          return <LinkPreview key={index} url={part} />;
        }
        
        // Render markdown for non-URL parts
        if (part.trim()) {
          return (
            <div key={index} className="prose prose-sm max-w-none">
              <ReactMarkdown 
                components={{
                  // Customize markdown components to match chat styling
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-3 italic text-gray-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {part}
              </ReactMarkdown>
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
}
