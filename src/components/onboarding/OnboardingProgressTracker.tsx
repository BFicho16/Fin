// 'use client';

// import { useState } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
// import { CheckCircle, Circle, ChevronDown, ChevronRight, Loader2, User, Heart, TrendingUp, SquareCheck } from 'lucide-react';
// import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
// import { getAllCategories } from './onboardingConfig';
// import WeeklyRoutineProgress from './WeeklyRoutineProgress';

// interface OnboardingProgressTrackerProps {
//   userId: string;
// }

// export default function OnboardingProgressTracker({ userId }: OnboardingProgressTrackerProps) {
//   const { categoryStatuses, isComplete, isLoading, error } = useOnboardingProgress(userId);
//   const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
//   const [isCompleting, setIsCompleting] = useState(false);

//   const toggleExpanded = (categoryId: string) => {
//     setExpandedItems(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(categoryId)) {
//         newSet.delete(categoryId);
//       } else {
//         newSet.add(categoryId);
//       }
//       return newSet;
//     });
//   };

//   const handleCompleteOnboarding = async () => {
//     setIsCompleting(true);
//     try {
//       const response = await fetch('/api/user/onboarding', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to complete onboarding');
//       }

//       // Reload the page to switch to the main dashboard
//       window.location.reload();
//     } catch (error) {
//       console.error('Error completing onboarding:', error);
//       alert('Failed to complete onboarding. Please try again.');
//     } finally {
//       setIsCompleting(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="h-full flex flex-col">
//         <div className="p-4 border-b">

//           <p className="text-md text-foreground mt-1">
//             Loading your progress...
//           </p>
//         </div>
//         <div className="flex-1 flex items-center justify-center">
//           <Loader2 className="h-6 w-6 animate-spin" />
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="h-full flex flex-col">
//         <div className="p-4 border-b">
//           <h2 className="text-lg font-semibold">Getting to Know You</h2>
//           <p className="text-sm text-muted-foreground mt-1">
//             Error loading progress
//           </p>
//         </div>
//         <div className="flex-1 flex items-center justify-center">
//           <p className="text-sm text-muted-foreground">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   const categories = getAllCategories();
//   const completedCount = categoryStatuses.filter(status => status.completed).length;
//   const totalCount = categories.length;

//   return (
//     <div className="h-full flex flex-col">
//       {/* Header */}
//       <div className="p-4 border-b">
//         <div className="flex items-center space-x-2">
//           <SquareCheck className="h-5 w-5 text-primary" />
//           <h2 className="text-lg font-semibold">Longevity Profile</h2>
//         </div>
//       </div>

//       {/* Scrollable Content */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-3">
//         {categories.map((category) => {
//           const status = categoryStatuses.find(s => s.id === category.id);
//           const completed = status?.completed || false;
//           const isExpanded = expandedItems.has(category.id);
//           const Icon = category.icon;

//           // Special rendering for demographics and health metrics - all cards in one row
//           if (category.id === 'demographics' || category.id === 'healthMetrics') {
//             const profile = status?.data?.profile;
//             const metrics = status?.data?.metrics || [];
//             const hasAge = !!profile?.birth_date;
//             const hasGender = !!profile?.gender;
//             const weightMetric = metrics.find((m: any) => m.metric_type === 'weight');
//             const heightMetric = metrics.find((m: any) => m.metric_type === 'height');
            
//             // Only render once for demographics, skip healthMetrics to avoid duplicate
//             if (category.id === 'healthMetrics') {
//               return null;
//             }
            
//             return (
//               <div key="metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                 {/* Age Card */}
//                 <Card className={`transition-all ${hasAge ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
//                     <CardTitle className="text-xs font-medium">Age</CardTitle>
//                     {hasAge ? (
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                     ) : (
//                       <Circle className="h-4 w-4 text-gray-400" />
//                     )}
//                   </CardHeader>
//                   <CardContent>
//                     {hasAge ? (
//                       <div>
//                         <div className="text-2xl font-bold">
//                           {new Date().getFullYear() - new Date(profile.birth_date).getFullYear()}
//                         </div>
//                         <p className="text-[10px] text-muted-foreground">years</p>
//                       </div>
//                     ) : (
//                       <div>
//                         <div className="text-2xl font-bold text-muted-foreground">-</div>
//                         <p className="text-[10px] text-muted-foreground">years</p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Gender Card */}
//                 <Card className={`transition-all ${hasGender ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
//                     <CardTitle className="text-xs font-medium">Gender</CardTitle>
//                     {hasGender ? (
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                     ) : (
//                       <Circle className="h-4 w-4 text-gray-400" />
//                     )}
//                   </CardHeader>
//                   <CardContent>
//                     {hasGender ? (
//                       <div className="text-2xl font-bold">
//                         {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
//                       </div>
//                     ) : (
//                       <div className="text-2xl font-bold text-muted-foreground">-</div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Weight Card */}
//                 <Card className={`transition-all ${weightMetric ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
//                     <CardTitle className="text-xs font-medium">Weight</CardTitle>
//                     {weightMetric ? (
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                     ) : (
//                       <Circle className="h-4 w-4 text-gray-400" />
//                     )}
//                   </CardHeader>
//                   <CardContent>
//                     {weightMetric ? (
//                       <div>
//                         <div className="text-2xl font-bold">
//                           {weightMetric.value}
//                         </div>
//                         <p className="text-[10px] text-muted-foreground">{weightMetric.unit}</p>
//                       </div>
//                     ) : (
//                       <div>
//                         <div className="text-2xl font-bold text-muted-foreground">-</div>
//                         <p className="text-[10px] text-muted-foreground">lbs</p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>

//                 {/* Height Card */}
//                 <Card className={`transition-all ${heightMetric ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
//                     <CardTitle className="text-xs font-medium">Height</CardTitle>
//                     {heightMetric ? (
//                       <CheckCircle className="h-4 w-4 text-green-600" />
//                     ) : (
//                       <Circle className="h-4 w-4 text-gray-400" />
//                     )}
//                   </CardHeader>
//                   <CardContent>
//                     {heightMetric ? (
//                       <div>
//                         <div className="text-2xl font-bold">
//                           {heightMetric.value}
//                         </div>
//                         <p className="text-[10px] text-muted-foreground">{heightMetric.unit}</p>
//                       </div>
//                     ) : (
//                       <div>
//                         <div className="text-2xl font-bold text-muted-foreground">-</div>
//                         <p className="text-[10px] text-muted-foreground">in</p>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               </div>
//             );
//           }

//           // Special rendering for routines - use WeeklyRoutineProgress component
//           if (category.id === 'routines') {
//             const routines = status?.data?.routines || [];
//             return (
//               <WeeklyRoutineProgress key="routines" userId={userId} routines={routines} />
//             );
//           }

//           // Default rendering for other categories
//           return (
//             <Card key={category.id} className={`transition-all ${completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
//               <CardContent className="p-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3">
//                     {/* Don't show completion dot for dietary restrictions */}
//                     {category.id !== 'dietaryPreferences' && (
//                       <div className="flex-shrink-0">
//                         {completed ? (
//                           <CheckCircle className="h-5 w-5 text-green-600" />
//                         ) : (
//                           <Circle className="h-5 w-5 text-gray-400" />
//                         )}
//                       </div>
//                     )}
//                     <div className="flex items-center space-x-2">
//                       <Icon className="h-4 w-4 text-gray-600" />
//                       <div>
//                         <h3 className="text-sm font-medium">{category.label}</h3>
//                         <p className="text-xs text-muted-foreground">{category.description}</p>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center space-x-2">
//                     {category.multipleItems && status?.displayData && (
//                       <Badge variant="secondary" className="text-xs">
//                         {status.displayData.count} item{status.displayData.count !== 1 ? 's' : ''}
//                       </Badge>
//                     )}
                    
//                     {category.multipleItems && status?.displayData && status.displayData.count > 0 && (
//                       <Collapsible>
//                         <CollapsibleTrigger asChild>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-6 w-6 p-0"
//                             onClick={() => toggleExpanded(category.id)}
//                           >
//                             {isExpanded ? (
//                               <ChevronDown className="h-3 w-3" />
//                             ) : (
//                               <ChevronRight className="h-3 w-3" />
//                             )}
//                           </Button>
//                         </CollapsibleTrigger>
//                         <CollapsibleContent>
//                           <div className="mt-2 pl-6">
//                             <div className="space-y-1">
//                               {status.displayData.items.map((item, index) => (
//                                 <div key={index} className="text-xs text-muted-foreground">
//                                   • {item}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         </CollapsibleContent>
//                       </Collapsible>
//                     )}
//                   </div>
//                 </div>

//                 {!category.multipleItems && completed && (
//                   <div className="mt-2 pl-8">
//                     <p className="text-xs text-green-600">✓ Completed</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Fixed Footer with Get Started Button */}
//       <div className="border-t p-4">
//         <Button 
//           onClick={handleCompleteOnboarding}
//           disabled={!isComplete || isCompleting}
//           className="w-full"
//         >
//           {isCompleting ? (
//             <>
//               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//               Completing...
//             </>
//           ) : (
//             'Get Started'
//           )}
//         </Button>
//         {!isComplete && (
//           <p className="text-xs text-muted-foreground mt-2 text-center">
//             Complete all required categories to continue
//           </p>
//         )}
//       </div>
//     </div>
//   );
// }
