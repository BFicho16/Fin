'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { dashboardSections, DashboardSection } from './dashboardConfig';

interface DashboardPanelProps {
  userId: string;
}

export default function DashboardPanel({ userId }: DashboardPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Initialize expanded state from config
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    dashboardSections.forEach(section => {
      initialExpanded[section.id] = section.defaultExpanded;
    });
    setExpandedSections(initialExpanded);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderSection = (section: DashboardSection) => {
    const Component = section.component;
    const Icon = section.icon;
    const isExpanded = expandedSections[section.id];

    return (
      <Card key={section.id} className="mb-3">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleSection(section.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Component userId={userId} embedded={true} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      {dashboardSections
        .sort((a, b) => a.order - b.order)
        .map(renderSection)}
    </div>
  );
}

