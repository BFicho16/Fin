import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function WaitlistConfirmationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">You’re on the waitlist</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Thanks for sharing your sleep routine. We’ve added you to the queue and will email your personalized analysis as soon as a spot opens up. Keep an eye on your inbox!
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

