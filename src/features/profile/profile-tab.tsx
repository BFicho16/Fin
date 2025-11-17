'use client';

interface ProfileTabProps {
  userId: string;
}

export default function ProfileTab({ userId }: ProfileTabProps) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center text-muted-foreground">
        <p className="text-lg font-medium mb-2">Profile</p>
        <p className="text-sm">Content coming soon</p>
      </div>
    </div>
  );
}


