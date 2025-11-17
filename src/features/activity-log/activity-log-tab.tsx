'use client';

interface ActivityLogTabProps {
  userId: string;
}

export default function ActivityLogTab({ userId }: ActivityLogTabProps) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">Activity Log</p>
        <p className="text-sm">Content coming soon</p>
      </div>
    </div>
  );
}


