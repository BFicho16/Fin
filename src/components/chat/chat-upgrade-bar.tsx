'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HeartPlus } from 'lucide-react';

interface ChatUpgradeBarProps {}

export function ChatUpgradeBar({}: ChatUpgradeBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLearnMore = () => {
    // Update URL to open the upgrade modal
    const params = new URLSearchParams(searchParams.toString());
    params.set('upgrade', 'true');
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl);
  };

  return (
    <div className="w-full animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-md">
        <div className="flex items-center gap-2 flex-1">
          <HeartPlus className="h-4 w-4 text-primary" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Fin Pro</span>
            {' | '}
            <span className="font-normal">Slow Your Body's Decay</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleLearnMore}
            className="h-7 px-3 text-xs"
          >
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}

