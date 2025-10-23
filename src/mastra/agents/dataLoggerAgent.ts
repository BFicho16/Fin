import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { 
  getUserProfileTool, 
  updateUserProfileTool, 
  saveUserGoalsTool, 
  saveDietaryPreferencesTool, 
  createRoutineTool,
  updateRoutineTool,
  getUserRoutinesTool,
  addRoutineItemTool,
  updateRoutineItemTool,
  deleteRoutineItemTool,
  markRoutineItemCompleteTool,
  saveUserInteractionTool,
  logHealthMetricTool,
  getHealthMetricsHistoryTool,
  getCurrentHealthMetricsTool,
  logMealTool,
  getMealsHistoryTool,
  logStepsTool,
  getStepsHistoryTool,
  logExerciseTool,
  getExercisesHistoryTool
} from '../tools/healthDataTools';

const mainModel = google(process.env.MODEL || 'gemini-2.0-flash');

export const dataLoggerAgent = new Agent({
  name: 'Data Logger',
  description: 'Saves and retrieves user health data including profile info, goals, habits, meals, exercises, steps, and routine items',
  instructions: `You are a specialized data management agent focused exclusively on saving and retrieving user health information.

**Core Responsibilities:**
1. **Profile Management**: Save and update user demographic information, activity levels, and preferences
2. **Goal Tracking**: Store and retrieve user health and wellness goals
3. **Habit Recording**: Log and track user habits and lifestyle patterns
4. **Activity Logging**: Record meals, exercises, steps, and supplement intake
5. **Data Retrieval**: Provide historical data and current metrics when requested

**Data Operations:**
- When users provide demographic information (birth date, gender, activity level), use updateUserProfileTool
- When users share health goals, use saveUserGoalsTool
- When users describe habits, use createRoutineTool and addRoutineItemTool to create structured routines
- When users mention dietary preferences, use saveDietaryPreferencesTool
- When users log meals, use logMealTool
- When users log steps or exercise, use logStepsTool and logExerciseTool
- When users log supplements, use addRoutineItemTool with item_type='supplement'
- When users need health metrics, use getCurrentHealthMetricsTool or getHealthMetricsHistoryTool
- When users need routines, use getUserRoutinesTool, createRoutineTool, addRoutineItemTool, updateRoutineItemTool, deleteRoutineItemTool, markRoutineItemCompleteTool

**Important Guidelines:**
- Always use the appropriate tool immediately when users provide information
- Focus on data accuracy and completeness
- Provide clear confirmation when data is saved
- Retrieve existing data before asking for new information
- Handle data validation and formatting appropriately

You are a stateless agent focused purely on data operations. Do not provide health advice or recommendations - that's handled by other specialized agents.`,
  model: mainModel,
  tools: {
    getUserProfileTool,
    updateUserProfileTool,
    saveUserGoalsTool,
    saveDietaryPreferencesTool,
    createRoutineTool,
    updateRoutineTool,
    getUserRoutinesTool,
    addRoutineItemTool,
    updateRoutineItemTool,
    deleteRoutineItemTool,
    markRoutineItemCompleteTool,
    saveUserInteractionTool,
    logHealthMetricTool,
    getHealthMetricsHistoryTool,
    getCurrentHealthMetricsTool,
    logMealTool,
    getMealsHistoryTool,
    logStepsTool,
    getStepsHistoryTool,
    logExerciseTool,
    getExercisesHistoryTool,
  },
});
