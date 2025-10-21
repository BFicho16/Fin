'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card } from '@/components/ui/card';
import { LayoutDashboard } from 'lucide-react';
import DashboardPanel from './DashboardPanel';

interface MobileDashboardDrawerProps {
  userId: string;
}

export default function MobileDashboardDrawer({ userId }: MobileDashboardDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-all duration-200 bg-background/95 backdrop-blur-sm"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="sr-only">Open Dashboard</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[90vw] sm:w-[400px] p-0 transition-all duration-300"
        >
          <div className="h-full overflow-y-auto">
            <Card className="h-full m-4 shadow-xl border-0">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Health Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Your health data and tools
                </p>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-80px)]">
                <DashboardPanel userId={userId} />
              </div>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
