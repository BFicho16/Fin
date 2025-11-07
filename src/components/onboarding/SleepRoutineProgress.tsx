'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SleepRoutine, SleepRoutineProgress } from '@/lib/sleepRoutine';
import { Moon, Sun, Clock } from 'lucide-react';

interface SleepRoutineProgressProps {
  sleepRoutine: SleepRoutine;
  progress: SleepRoutineProgress | null;
}

const RoutineItems = ({
  items,
  placeholder,
}: {
  items: SleepRoutine['night']['pre_bed'];
  placeholder: string;
}) => {
  if (!items.length) {
    const placeholders = [
      'Have a snack',
      'Get in bed and read',
      'Put on a sleep mask',
    ];

    return (
      <ul className="space-y-2 text-sm text-muted-foreground">
        {placeholders.map((label, index) => (
          <li key={`placeholder-${index}`} className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <span className="italic text-muted-foreground/80">{label}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={`${item.item_name}-${index}`} className="text-sm text-muted-foreground">
          • {item.item_name}
        </li>
      ))}
    </ul>
  );
};

export default function SleepRoutineProgressCard({ sleepRoutine, progress }: SleepRoutineProgressProps) {
  const bedtime = sleepRoutine.night?.bedtime;
  const wakeTime = sleepRoutine.morning?.wake_time;
  const preBed = sleepRoutine.night?.pre_bed || [];

  const parseTimeToMinutes = (time?: string | null) => {
    if (!time) return null;
    const cleaned = time.trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const meridiem = match[3];
    if (hours === 12) {
      hours = meridiem === 'AM' ? 0 : 12;
    } else if (meridiem === 'PM') {
      hours += 12;
    }
    return hours * 60 + minutes;
  };

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return '00:00';
    const hoursPart = Math.floor(minutes / 60);
    const minutesPart = minutes % 60;
    if (hoursPart <= 0 && minutesPart <= 0) return '00:00';
    if (minutesPart === 0) return `${hoursPart}h`;
    if (hoursPart === 0) return `${minutesPart}m`;
    return `${hoursPart}h ${minutesPart}m`;
  };

  const bedtimeMinutes = parseTimeToMinutes(bedtime);
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  let hoursSlept: number | null = null;
  if (bedtimeMinutes !== null && wakeMinutes !== null) {
    const diff = wakeMinutes - bedtimeMinutes;
    hoursSlept = diff >= 0 ? diff : diff + 24 * 60;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              Bedtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{bedtime || '00:00 PM'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              Wake-Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{wakeTime || '00:00 AM'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Hours Slept
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatDuration(hoursSlept)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Bedtime Routine</CardTitle>
        </CardHeader>
        <CardContent>
          <RoutineItems items={preBed} placeholder="Add the steps you follow before bed" />
        </CardContent>
      </Card>
    </div>
  );
}

