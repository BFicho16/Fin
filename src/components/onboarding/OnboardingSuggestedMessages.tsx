export interface SuggestedMessage {
  id: string;
  category: 'demographics' | 'healthMetrics' | 'dietaryPreferences' | 'routines';
  priority: number; // Lower = higher priority (1-4)
  requiredFields: string[]; // Fields that must be missing to show this message
  completedFields: string[]; // Fields that must be complete to show this message
  text: string; // The exact message text to populate
}

export const suggestedMessages: SuggestedMessage[] = [
  // Demographics - Priority 1 (Birth Date and Gender only)
  {
    id: 'demographics-birth-gender-male1',
    category: 'demographics',
    priority: 1,
    requiredFields: ['age', 'gender'],
    completedFields: [],
    text: "I'm male and was born on 2/12/1986"
  },
  {
    id: 'demographics-birth-gender-female1',
    category: 'demographics',
    priority: 1,
    requiredFields: ['age', 'gender'],
    completedFields: [],
    text: "I'm female and was born on 5/15/1995"
  },
  {
    id: 'demographics-birth-gender-male2',
    category: 'demographics',
    priority: 1,
    requiredFields: ['age', 'gender'],
    completedFields: [],
    text: "I'm male and was born on 11/8/1981"
  },
  {
    id: 'demographics-birth-gender-female2',
    category: 'demographics',
    priority: 1,
    requiredFields: ['age', 'gender'],
    completedFields: [],
    text: "I'm female and was born on 7/3/1990"
  },
  {
    id: 'demographics-birth-gender-male3',
    category: 'demographics',
    priority: 1,
    requiredFields: ['age', 'gender'],
    completedFields: [],
    text: "I'm male and was born on 3/25/1998"
  },

  // Health Metrics - Priority 2 (Height and Weight together)
  {
    id: 'health-height-weight-1',
    category: 'healthMetrics',
    priority: 2,
    requiredFields: ['height', 'weight'],
    completedFields: ['age', 'gender'],
    text: "I'm 6'1\" and weigh 180 lbs"
  },
  {
    id: 'health-height-weight-2',
    category: 'healthMetrics',
    priority: 2,
    requiredFields: ['height', 'weight'],
    completedFields: ['age', 'gender'],
    text: "My height is 5'6\" and I weigh 150 lbs"
  },
  {
    id: 'health-height-weight-3',
    category: 'healthMetrics',
    priority: 2,
    requiredFields: ['height', 'weight'],
    completedFields: ['age', 'gender'],
    text: "I'm 5'10\" tall and weigh 165 lbs"
  },
  {
    id: 'health-height-weight-4',
    category: 'healthMetrics',
    priority: 2,
    requiredFields: ['height', 'weight'],
    completedFields: ['age', 'gender'],
    text: "I'm 5'4\" and weigh 140 lbs"
  },
  {
    id: 'health-height-weight-5',
    category: 'healthMetrics',
    priority: 2,
    requiredFields: ['height', 'weight'],
    completedFields: ['age', 'gender'],
    text: "My height is 6'3\" and I weigh 200 lbs"
  },

  // Routines - Priority 3
  {
    id: 'routine-morning',
    category: 'routines',
    priority: 3,
    requiredFields: ['morning_routine'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I wake up around 7 AM and typically exercise for 30 minutes"
  },
  {
    id: 'routine-night',
    category: 'routines',
    priority: 3,
    requiredFields: ['night_routine'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I usually go to bed around 10 PM after reading for 20 minutes"
  },
  {
    id: 'routine-weekend',
    category: 'routines',
    priority: 3,
    requiredFields: ['weekend_routine'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "On weekends I sleep in until 9 AM and have a relaxed morning routine"
  },
  {
    id: 'routine-exercise',
    category: 'routines',
    priority: 3,
    requiredFields: ['exercise_routine'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I exercise 4 times a week, usually in the morning before work"
  },

  // Dietary Preferences - Priority 4
  {
    id: 'dietary-allergies',
    category: 'dietaryPreferences',
    priority: 4,
    requiredFields: ['dietary_preferences'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I'm allergic to shellfish and avoid dairy"
  },
  {
    id: 'dietary-restrictions',
    category: 'dietaryPreferences',
    priority: 4,
    requiredFields: ['dietary_preferences'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I don't eat gluten or processed sugar"
  },
  {
    id: 'dietary-vegetarian',
    category: 'dietaryPreferences',
    priority: 4,
    requiredFields: ['dietary_preferences'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I'm vegetarian and try to eat mostly whole foods"
  },
  {
    id: 'dietary-intermittent-fasting',
    category: 'dietaryPreferences',
    priority: 4,
    requiredFields: ['dietary_preferences'],
    completedFields: ['age', 'gender', 'height', 'weight'],
    text: "I practice intermittent fasting and eat between 12 PM and 8 PM"
  }
];

export function getFilteredSuggestedMessages(progressData: any, dismissedMessages: Set<string>): SuggestedMessage[] {
  if (!progressData) return [];

  const { progress, profile, healthMetrics, dietaryPreferences, routines } = progressData;

  // Determine what fields are completed
  const completedFields = new Set<string>();
  
  // Check demographics - check individual fields
  if (profile?.birth_date) completedFields.add('age');
  if (profile?.gender) completedFields.add('gender');

  // Check health metrics - check individual fields
  if (healthMetrics?.some((m: any) => m.metric_type === 'weight')) completedFields.add('weight');
  if (healthMetrics?.some((m: any) => m.metric_type === 'height')) completedFields.add('height');

  // Check routines
  if (progress?.routinesComplete) {
    completedFields.add('morning_routine');
    completedFields.add('night_routine');
    completedFields.add('weekend_routine');
    completedFields.add('exercise_routine');
  }

  // Check dietary preferences
  if (dietaryPreferences && Object.keys(dietaryPreferences).length > 0) {
    completedFields.add('dietary_preferences');
  }

  // Find the highest priority level that has incomplete messages
  let currentPriority = 1;
  let filteredMessages: SuggestedMessage[] = [];

  // Check each priority level until we find messages to show
  for (let priority = 1; priority <= 4; priority++) {
    const messagesForPriority = suggestedMessages.filter(message => {
      // Skip if message was dismissed
      if (dismissedMessages.has(message.id)) return false;
      
      // Only show messages for current priority
      if (message.priority !== priority) return false;

      // Check if required fields are missing (we want to show messages for incomplete data)
      const hasRequiredMissingFields = message.requiredFields.some(field => !completedFields.has(field));
      
      // Check if completed fields are actually completed
      const hasCompletedFields = message.completedFields.every(field => completedFields.has(field));

      return hasRequiredMissingFields && hasCompletedFields;
    });

    if (messagesForPriority.length > 0) {
      filteredMessages = messagesForPriority.slice(0, 5);
      break; // Only show messages from the highest priority level that has incomplete items
    }
  }

  return filteredMessages;
}
