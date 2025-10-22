import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Welcome user and explain the process
const welcomeUserStep = createStep({
  id: 'welcome-user',
  inputSchema: z.object({}),
  outputSchema: z.object({
    userWelcomed: z.boolean(),
  }),
  resumeSchema: z.object({
    userWelcomed: z.boolean(),
  }),
  suspendSchema: z.object({
    message: z.object({
      content: z.string(),
    }),
  }),
  execute: async ({ resumeData, suspend }) => {
    if (resumeData) {
      return resumeData;
    }

    await suspend({
      message: {
        content: `Welcome! I'm your personal health and wellness coach. I'm here to help you create a personalized wellness plan that fits your lifestyle and goals.

To get started, I'll need to learn about you and your health goals. This conversation will help me understand:
• Your current health and fitness level
• Your goals and what you want to achieve
• Your lifestyle, habits, and preferences
• Any dietary restrictions or health considerations

This information will help me create a customized wellness plan just for you. Are you ready to begin?`,
      },
    });

    return {
      userWelcomed: true,
    };
  },
});

// Step 2: Gather demographics
const gatherDemographicsStep = createStep({
  id: 'gather-demographics',
  inputSchema: z.object({
    userWelcomed: z.boolean(),
  }),
  outputSchema: z.object({
    demographics: z.object({
      birth_date: z.string().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      gender: z.string().optional(),
      activity_level: z.string().optional(),
    }),
  }),
  resumeSchema: z.object({
    demographics: z.object({
      birth_date: z.string().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      gender: z.string().optional(),
      activity_level: z.string().optional(),
    }),
  }),
  suspendSchema: z.object({
    message: z.object({
      content: z.string(),
    }),
  }),
  execute: async ({ inputData, resumeData, suspend, mastra }) => {
    if (resumeData) {
      return resumeData;
    }

    const agent = mastra.getAgent('longevityCoachAgent');
    
    await suspend({
      message: {
        content: `Let's start with some basic information about you. Please tell me:

1. What's your birth date? (You can say your age if you prefer, like "I'm 30 years old")
2. What's your current weight (in pounds or kg)?
3. What's your height (in feet/inches or cm)?
4. What's your gender?
5. How would you describe your current activity level?
   - Sedentary (little to no exercise)
   - Lightly active (light exercise 1-3 days/week)
   - Moderately active (moderate exercise 3-5 days/week)
   - Very active (hard exercise 6-7 days/week)
   - Extremely active (very hard exercise, physical job, or training twice/day)

You can share this information in any format that's comfortable for you.`,
      },
    });

    // The agent will process the user's response and extract demographics
    // This step will be resumed with the extracted data
    return {
      demographics: {
        birth_date: undefined,
        weight: undefined,
        height: undefined,
        gender: undefined,
        activity_level: undefined,
      },
    };
  },
});

// Step 3: Understand goals
const understandGoalsStep = createStep({
  id: 'understand-goals',
  inputSchema: z.object({
    demographics: z.object({
      birth_date: z.string().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      gender: z.string().optional(),
      activity_level: z.string().optional(),
    }),
  }),
  outputSchema: z.object({
    goals: z.array(z.object({
      goal_type: z.string(),
      goal_description: z.string().optional(),
      target_value: z.number().optional(),
      target_unit: z.string().optional(),
      target_date: z.string().optional(),
      priority: z.number(),
    })),
  }),
  resumeSchema: z.object({
    goals: z.array(z.object({
      goal_type: z.string(),
      goal_description: z.string().optional(),
      target_value: z.number().optional(),
      target_unit: z.string().optional(),
      target_date: z.string().optional(),
      priority: z.number(),
    })),
  }),
  suspendSchema: z.object({
    message: z.object({
      content: z.string(),
    }),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return resumeData;
    }

    await suspend({
      message: {
        content: `Great! Now let's talk about your health and wellness goals. What would you like to achieve? 

For example:
• Weight loss or weight gain
• Building muscle or strength
• Improving endurance or cardiovascular health
• General health and longevity
• Sports performance
• Rehabilitation or recovery

Please tell me:
1. What are your primary goals?
2. Are there any specific targets (like losing 20 pounds or running a 5K)?
3. Do you have a timeline in mind?
4. What's most important to you right now?

Feel free to share multiple goals if you have them.`,
      },
    });

    return {
      goals: [],
    };
  },
});

// Step 4: Learn about current habits
const learnCurrentHabitsStep = createStep({
  id: 'learn-current-habits',
  inputSchema: z.object({
    goals: z.array(z.object({
      goal_type: z.string(),
      goal_description: z.string().optional(),
      target_value: z.number().optional(),
      target_unit: z.string().optional(),
      target_date: z.string().optional(),
      priority: z.number(),
    })),
  }),
  outputSchema: z.object({
    habits: z.array(z.object({
      habit_type: z.string(),
      habit_name: z.string(),
      frequency: z.string(),
      duration_minutes: z.number().optional(),
      intensity: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
  resumeSchema: z.object({
    habits: z.array(z.object({
      habit_type: z.string(),
      habit_name: z.string(),
      frequency: z.string(),
      duration_minutes: z.number().optional(),
      intensity: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
  suspendSchema: z.object({
    message: z.object({
      content: z.string(),
    }),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return resumeData;
    }

    await suspend({
      message: {
        content: `Now let's talk about your current lifestyle and habits. This helps me understand what's already working for you and what we might need to adjust.

Please tell me about:
1. **Exercise**: What physical activity do you currently do? How often and for how long?
2. **Sleep**: How many hours do you typically sleep? Do you have a regular sleep schedule?
3. **Diet**: How do you typically eat? How many meals per day? Any current dietary patterns?
4. **Hydration**: How much water do you drink daily?
5. **Stress Management**: How do you currently handle stress?
6. **Supplements**: Do you take any vitamins or supplements?

Share whatever you're comfortable with - even if it's "I don't exercise regularly" or "I eat whatever I want." This helps me create a realistic plan for you.`,
      },
    });

    return {
      habits: [],
    };
  },
});

// Step 5: Identify preferences and restrictions
const identifyPreferencesStep = createStep({
  id: 'identify-preferences',
  inputSchema: z.object({
    habits: z.array(z.object({
      habit_type: z.string(),
      habit_name: z.string(),
      frequency: z.string(),
      duration_minutes: z.number().optional(),
      intensity: z.string().optional(),
      description: z.string().optional(),
    })),
  }),
  outputSchema: z.object({
    preferences: z.object({
      dietary_style: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      intolerances: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      preferred_foods: z.array(z.string()).optional(),
      disliked_foods: z.array(z.string()).optional(),
      cooking_skill_level: z.string().optional(),
      budget_range: z.string().optional(),
    }),
  }),
  resumeSchema: z.object({
    preferences: z.object({
      dietary_style: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      intolerances: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      preferred_foods: z.array(z.string()).optional(),
      disliked_foods: z.array(z.string()).optional(),
      cooking_skill_level: z.string().optional(),
      budget_range: z.string().optional(),
    }),
  }),
  suspendSchema: z.object({
    message: z.object({
      content: z.string(),
    }),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return resumeData;
    }

    await suspend({
      message: {
        content: `Let's talk about your dietary preferences and any restrictions. This helps me create meal plans and nutrition recommendations that you'll actually enjoy and can follow.

Please tell me about:
1. **Dietary Style**: Are you vegetarian, vegan, omnivore, keto, paleo, etc.?
2. **Allergies**: Any food allergies I should know about?
3. **Intolerances**: Any foods that don't agree with you?
4. **Restrictions**: Any dietary restrictions for health, religious, or personal reasons?
5. **Preferences**: What foods do you love? What do you dislike?
6. **Cooking**: What's your cooking skill level? (beginner, intermediate, advanced)
7. **Budget**: How would you describe your food budget? (low, medium, high)

If any of these don't apply to you, just say "none" or "not applicable."`,
      },
    });

    return {
      preferences: {
        dietary_style: undefined,
        allergies: undefined,
        intolerances: undefined,
        restrictions: undefined,
        preferred_foods: undefined,
        disliked_foods: undefined,
        cooking_skill_level: undefined,
        budget_range: undefined,
      },
    };
  },
});

// Step 6: Confirm collected information
const confirmInformationStep = createStep({
  id: 'confirm-information',
  inputSchema: z.object({
    demographics: z.object({
      birth_date: z.string().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      gender: z.string().optional(),
      activity_level: z.string().optional(),
    }),
    goals: z.array(z.object({
      goal_type: z.string(),
      goal_description: z.string().optional(),
      target_value: z.number().optional(),
      target_unit: z.string().optional(),
      target_date: z.string().optional(),
      priority: z.number(),
    })),
    habits: z.array(z.object({
      habit_type: z.string(),
      habit_name: z.string(),
      frequency: z.string(),
      duration_minutes: z.number().optional(),
      intensity: z.string().optional(),
      description: z.string().optional(),
    })),
    preferences: z.object({
      dietary_style: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      intolerances: z.array(z.string()).optional(),
      restrictions: z.array(z.string()).optional(),
      preferred_foods: z.array(z.string()).optional(),
      disliked_foods: z.array(z.string()).optional(),
      cooking_skill_level: z.string().optional(),
      budget_range: z.string().optional(),
    }),
  }),
  outputSchema: z.object({
    confirmed: z.boolean(),
    allData: z.object({
      demographics: z.any(),
      goals: z.any(),
      habits: z.any(),
      preferences: z.any(),
    }),
  }),
  resumeSchema: z.object({
    confirmed: z.boolean(),
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        allData: inputData,
      };
    }

    // Create a summary of all collected information
    const summary = `
**Your Health Profile Summary:**

**Demographics:**
- Birth Date: ${inputData.demographics.birth_date || 'Not specified'}
- Weight: ${inputData.demographics.weight || 'Not specified'}
- Height: ${inputData.demographics.height || 'Not specified'}
- Gender: ${inputData.demographics.gender || 'Not specified'}
- Activity Level: ${inputData.demographics.activity_level || 'Not specified'}

**Goals:**
${inputData.goals.map(goal => `- ${goal.goal_type}: ${goal.goal_description || 'No description'}`).join('\n') || 'No goals specified'}

**Current Habits:**
${inputData.habits.map(habit => `- ${habit.habit_name}: ${habit.frequency}`).join('\n') || 'No habits specified'}

**Dietary Preferences:**
- Style: ${inputData.preferences.dietary_style || 'Not specified'}
- Allergies: ${inputData.preferences.allergies?.join(', ') || 'None'}
- Restrictions: ${inputData.preferences.restrictions?.join(', ') || 'None'}
- Cooking Level: ${inputData.preferences.cooking_skill_level || 'Not specified'}
`;

    await suspend({
      message: {
        content: `Perfect! Here's what I've learned about you:

${summary}

Does this look accurate? Please let me know if anything needs to be corrected or if you'd like to add anything else. Once you confirm, I'll use this information to create your personalized wellness plan.`,
      },
    });

    return {
      confirmed: false,
      allData: inputData,
    };
  },
});

// Step 7: Save to database
const saveToDatabaseStep = createStep({
  id: 'save-to-database',
  inputSchema: z.object({
    confirmed: z.boolean(),
    allData: z.object({
      demographics: z.any(),
      goals: z.any(),
      habits: z.any(),
      preferences: z.any(),
    }),
  }),
  outputSchema: z.object({
    saved: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra.getAgent('longevityCoachAgent');
    const { allData } = inputData;

    try {
      // Save user profile
      if (allData.demographics) {
        await agent.generate(`Save user profile data: ${JSON.stringify(allData.demographics)}`, {
          memory: {
            thread: 'health-data-collection',
            resource: 'user-profile-collection',
          },
        });
      }

      // Save goals
      if (allData.goals && allData.goals.length > 0) {
        await agent.generate(`Save user goals: ${JSON.stringify(allData.goals)}`, {
          memory: {
            thread: 'health-data-collection',
            resource: 'user-profile-collection',
          },
        });
      }

      // Save habits
      if (allData.habits && allData.habits.length > 0) {
        await agent.generate(`Save user habits: ${JSON.stringify(allData.habits)}`, {
          memory: {
            thread: 'health-data-collection',
            resource: 'user-profile-collection',
          },
        });
      }

      // Save dietary preferences
      if (allData.preferences) {
        await agent.generate(`Save dietary preferences: ${JSON.stringify(allData.preferences)}`, {
          memory: {
            thread: 'health-data-collection',
            resource: 'user-profile-collection',
          },
        });
      }

      return {
        saved: true,
        message: 'Your health information has been saved successfully! I\'m now ready to create your personalized wellness plan.',
      };
    } catch (error) {
      return {
        saved: false,
        message: `There was an error saving your information: ${error}`,
      };
    }
  },
});

// Define the workflow
export const healthDataCollectionWorkflow = createWorkflow({
  id: 'health-data-collection-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    saved: z.boolean(),
    message: z.string(),
    allData: z.any(),
  }),
  steps: [
    welcomeUserStep,
    gatherDemographicsStep,
    understandGoalsStep,
    learnCurrentHabitsStep,
    identifyPreferencesStep,
    confirmInformationStep,
    saveToDatabaseStep,
  ],
});

// Chain the steps
healthDataCollectionWorkflow
  .then(welcomeUserStep)
  .then(gatherDemographicsStep)
  .then(understandGoalsStep)
  .then(learnCurrentHabitsStep)
  .then(identifyPreferencesStep)
  .then(confirmInformationStep)
  .then(saveToDatabaseStep)
  .commit();
