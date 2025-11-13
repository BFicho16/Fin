export type SleepRoutineItem = {
  item_name: string;
  item_type: 'exercise' | 'food' | 'supplement' | 'activity' | 'rest' | 'other';
  habit_classification?: 'good' | 'bad' | 'neutral';
  duration_minutes?: number;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  distance_km?: number;
  calories?: number;
  serving_size?: string;
  notes?: string;
  item_order?: number;
  is_optional?: boolean;
};

export interface SleepRoutine {
  night: {
    bedtime: string | null;
    pre_bed: SleepRoutineItem[];
  };
  morning: {
    wake_time: string | null;
  };
}

const VALID_ITEM_TYPES: SleepRoutineItem['item_type'][] = [
  'exercise',
  'food',
  'supplement',
  'activity',
  'rest',
  'other',
];

const VALID_HABIT_CLASSIFICATIONS: NonNullable<SleepRoutineItem['habit_classification']>[] = [
  'good',
  'bad',
  'neutral',
];

const clampToPositiveInteger = (value: unknown, fallback: number) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return fallback;
};

const sanitizeDurationField = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return undefined;
};

const sanitizeOptionalBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
};

const sanitizeOptionalString = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  return undefined;
};

const sanitizeItemType = (value: unknown): SleepRoutineItem['item_type'] => {
  if (typeof value === 'string' && VALID_ITEM_TYPES.includes(value as SleepRoutineItem['item_type'])) {
    return value as SleepRoutineItem['item_type'];
  }
  return 'activity';
};

const sanitizeHabitClassification = (
  value: unknown
): NonNullable<SleepRoutineItem['habit_classification']> => {
  if (
    typeof value === 'string' &&
    VALID_HABIT_CLASSIFICATIONS.includes(value as NonNullable<SleepRoutineItem['habit_classification']>)
  ) {
    return value as NonNullable<SleepRoutineItem['habit_classification']>;
  }
  return 'neutral';
};

const sanitizeRoutineItem = (rawItem: any, fallbackOrder: number): SleepRoutineItem | null => {
  if (!rawItem || typeof rawItem !== 'object') {
    return null;
  }

  const itemName = sanitizeOptionalString(rawItem.item_name);
  if (!itemName) {
    return null;
  }

  const itemOrder = clampToPositiveInteger(rawItem.item_order, fallbackOrder);

  const sanitizedItem: SleepRoutineItem = {
    item_name: itemName,
    item_type: sanitizeItemType(rawItem.item_type),
    habit_classification: sanitizeHabitClassification(rawItem.habit_classification),
    duration_minutes: sanitizeDurationField(rawItem.duration_minutes),
    sets: sanitizeDurationField(rawItem.sets),
    reps: sanitizeDurationField(rawItem.reps),
    weight_kg: sanitizeDurationField(rawItem.weight_kg),
    distance_km: sanitizeDurationField(rawItem.distance_km),
    calories: sanitizeDurationField(rawItem.calories),
    serving_size: sanitizeOptionalString(rawItem.serving_size),
    notes: sanitizeOptionalString(rawItem.notes),
    item_order: itemOrder,
    is_optional: sanitizeOptionalBoolean(rawItem.is_optional),
  };

  return sanitizedItem;
};

export const normalizeRoutineItems = (rawItems: any = []): SleepRoutineItem[] => {
  if (!Array.isArray(rawItems)) {
    return [];
  }

  let fallbackOrder = 1;
  const sanitized = rawItems
    .map((item) => {
      const sanitizedItem = sanitizeRoutineItem(item, fallbackOrder);
      fallbackOrder += 1;
      return sanitizedItem;
    })
    .filter((item): item is SleepRoutineItem => !!item);

  sanitized.sort((a, b) => {
    const orderDiff = (a.item_order ?? 0) - (b.item_order ?? 0);
    if (orderDiff !== 0) {
      return orderDiff;
    }
    return a.item_name.localeCompare(b.item_name);
  });

  return sanitized.map((item, index) => ({
    ...item,
    item_order: index + 1,
  }));
};

export interface SleepRoutineProgress {
  hasBedtime: boolean;
  hasWakeTime: boolean;
  preBedCount: number;
  isComplete: boolean;
  missing: string[];
  sleepRoutine: SleepRoutine;
}

export const ensureSleepRoutineShape = (raw: any = {}): SleepRoutine => {
  const bedtime = typeof raw?.night?.bedtime === 'string' ? raw.night.bedtime.trim() : null;
  const wakeTime = typeof raw?.morning?.wake_time === 'string' ? raw.morning.wake_time.trim() : null;

  return {
    night: {
      bedtime: bedtime?.length ? bedtime : null,
      pre_bed: normalizeRoutineItems(raw?.night?.pre_bed),
    },
    morning: {
      wake_time: wakeTime?.length ? wakeTime : null,
    },
  };
};

export const calculateSleepRoutineProgress = (sleepRoutine: SleepRoutine): SleepRoutineProgress => {
  const night = sleepRoutine.night;
  const morning = sleepRoutine.morning;

  const hasBedtime = !!(night.bedtime && night.bedtime.trim().length);
  const hasWakeTime = !!(morning.wake_time && morning.wake_time.trim().length);
  const preBedCount = night.pre_bed?.length || 0;
  const isComplete = hasBedtime && hasWakeTime && preBedCount > 0;

  const missing: string[] = [];
  if (!hasBedtime) missing.push('Add a bedtime');
  if (!hasWakeTime) missing.push('Add a wake-up time');
  if (!preBedCount) missing.push('Add at least one pre-bed activity');

  return {
    hasBedtime,
    hasWakeTime,
    preBedCount,
    isComplete,
    missing,
    sleepRoutine,
  };
};

