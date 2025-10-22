'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Bot, User, Coffee, Dumbbell, Moon, Utensils } from 'lucide-react';

// Type assertion to fix React 19 type conflicts
const CardComponent = Card as any;
const CardContentComponent = CardContent as any;
const BotIcon = Bot as any;
const UserIcon = User as any;
const CoffeeIcon = Coffee as any;
const DumbbellIcon = Dumbbell as any;
const MoonIcon = Moon as any;
const UtensilsIcon = Utensils as any;

export default function OnboardingEmptyState() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Getting to Know You</h2>
        <p className="text-sm text-muted-foreground mt-1">
          I'm learning about your lifestyle to create personalized routines
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">What I'm learning about:</h3>
          <div className="grid grid-cols-2 gap-3">
            <CardComponent className="p-3">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">Demographics</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Age, gender, height, weight
              </p>
            </CardComponent>
            
            <CardComponent className="p-3">
              <div className="flex items-center space-x-2">
                <UtensilsIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Eating Habits</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Meals, timing, preferences
              </p>
            </CardComponent>
            
            <CardComponent className="p-3">
              <div className="flex items-center space-x-2">
                <DumbbellIcon className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium">Activity Level</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Exercise, walking, workouts
              </p>
            </CardComponent>
            
            <CardComponent className="p-3">
              <div className="flex items-center space-x-2">
                <MoonIcon className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-medium">Sleep Patterns</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bedtime, wake time, duration
              </p>
            </CardComponent>
          </div>
        </div>

        {/* What to Expect */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">What to expect:</h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                I'll ask about your current lifestyle and habits
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                We'll cover both good and bad habits - everything matters!
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                I'll create personalized routines based on your actual patterns
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This takes about 5-10 minutes of conversation
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Tips for best results:</h3>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Be honest about your current habits - I'm not here to judge!
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Include both weekday and weekend differences
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Mention specific times, frequencies, and amounts when possible
              </p>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <BotIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Ready to start!</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Just start chatting with me on the left. I'll guide you through everything step by step.
          </p>
        </div>
      </div>
    </div>
  );
}
