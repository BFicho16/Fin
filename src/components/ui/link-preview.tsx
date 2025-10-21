'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  domain: string;
}

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [ogData, setOgData] = useState<OGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOGData = async () => {
      try {
        const response = await fetch(`/api/og-data?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          const data = await response.json();
          setOgData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching OG data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOGData();
  }, [url]);

  if (loading) {
    return (
      <Card className="mt-2 max-w-md border border-gray-200 rounded-lg overflow-hidden">
        <CardContent className="p-0">
          <Skeleton className="w-full h-32" />
          <div className="p-3">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ogData) {
    // Fallback to simple link
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 underline mt-2"
      >
        <Globe className="w-4 h-4 mr-1" />
        {url}
        <ExternalLink className="w-3 h-3 ml-1" />
      </a>
    );
  }

  return (
    <Card className="mt-2 max-w-md border border-gray-200 rounded-lg overflow-hidden link-preview">
      <a 
        href={ogData.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {ogData.image && (
          <div className="relative w-full h-32 overflow-hidden">
            <img 
              src={ogData.image} 
              alt={ogData.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <CardContent className="p-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm line-clamp-2 text-gray-900">
              {ogData.title}
            </h4>
            {ogData.description && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {ogData.description}
              </p>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <Globe className="w-3 h-3 mr-1" />
              <span className="truncate">{ogData.domain}</span>
              <ExternalLink className="w-3 h-3 ml-auto" />
            </div>
          </div>
        </CardContent>
      </a>
    </Card>
  );
}
