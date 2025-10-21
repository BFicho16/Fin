'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHealthDataRealtime } from '@/lib/supabase/realtime';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle, Calendar, Target, Eye, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface WellnessPlan {
  id: string;
  plan_name: string;
  plan_description?: string;
  plan_type: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  target_start_date?: string;
  target_end_date?: string;
  estimated_duration_weeks?: number;
  difficulty_level?: string;
  plan_data?: any;
  user_approval_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  user_feedback?: string;
  created_at: string;
  updated_at: string;
}

interface WellnessPlanViewerProps {
  userId: string;
}

export default function WellnessPlanViewer({ userId }: WellnessPlanViewerProps) {
  const [plans, setPlans] = useState<WellnessPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<WellnessPlan | null>(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected' | 'needs_revision'>('approved');
  const [feedback, setFeedback] = useState('');
  const [isLoadingPlanDetails, setIsLoadingPlanDetails] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch(`/api/plans/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Set up realtime subscriptions
  useHealthDataRealtime(userId, {
    onPlansUpdate: () => {
      fetchPlans();
    }
  });

  const fetchPlanDetails = async (planId: string) => {
    setIsLoadingPlanDetails(true);
    try {
      const response = await fetch(`/api/plans/${userId}/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPlan(data.plan);
        setShowPlanDetails(true);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    } finally {
      setIsLoadingPlanDetails(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedPlan) return;

    try {
      const response = await fetch(`/api/plans/${userId}/${selectedPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_approval_status: approvalStatus,
          user_feedback: feedback || undefined,
          status: approvalStatus === 'approved' ? 'active' : selectedPlan.status,
        }),
      });

      if (response.ok) {
        setPlans(prev => 
          prev.map(plan => 
            plan.id === selectedPlan.id 
              ? { ...plan, user_approval_status: approvalStatus, user_feedback: feedback }
              : plan
          )
        );
        setShowApprovalForm(false);
        setSelectedPlan(null);
        setFeedback('');
      }
    } catch (error) {
      console.error('Error updating plan approval:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'paused':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'paused':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getApprovalVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'needs_revision':
        return 'outline';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Wellness Plans
        </h3>
      </CardHeader>

      <CardContent>
        {plans.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">No wellness plans yet</p>
            <p className="text-sm mt-2">Start a conversation with your health assistant to create your first personalized plan!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(plan.status)}
                      <h4 className="font-medium">{plan.plan_name}</h4>
                      <Badge variant={getStatusVariant(plan.status) as any}>
                        {plan.status}
                      </Badge>
                      <Badge variant={getApprovalVariant(plan.user_approval_status) as any}>
                        {plan.user_approval_status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {plan.plan_description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                      <span className="capitalize">{plan.plan_type.replace('_', ' ')}</span>
                      {plan.difficulty_level && (
                        <span className="capitalize">• {plan.difficulty_level}</span>
                      )}
                      {plan.estimated_duration_weeks && (
                        <span>• {plan.estimated_duration_weeks} weeks</span>
                      )}
                      {plan.target_start_date && (
                        <span>• Starts: {new Date(plan.target_start_date).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchPlanDetails(plan.id)}
                        disabled={isLoadingPlanDetails}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {plan.user_approval_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowApprovalForm(true);
                              setApprovalStatus('approved');
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowApprovalForm(true);
                              setApprovalStatus('rejected');
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlan(plan);
                              setShowApprovalForm(true);
                              setApprovalStatus('needs_revision');
                            }}
                          >
                            Needs Revision
                          </Button>
                        </>
                      )}
                    </div>

                    {plan.user_feedback && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <strong>Your feedback:</strong> {plan.user_feedback}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Approval Dialog */}
      <Dialog open={showApprovalForm} onOpenChange={setShowApprovalForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalStatus === 'approved' ? 'Approve' : approvalStatus === 'rejected' ? 'Reject' : 'Request Revision'} Plan
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {approvalStatus === 'approved' ? 'Optional feedback:' : 'Please provide feedback:'}
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={approvalStatus === 'approved' 
                  ? 'Any additional notes or preferences...' 
                  : 'Please explain your decision...'
                }
                rows={3}
                required={approvalStatus !== 'approved'}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalForm(false);
                  setSelectedPlan(null);
                  setFeedback('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproval}
                variant={
                  approvalStatus === 'approved' 
                    ? 'default'
                    : approvalStatus === 'rejected'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {approvalStatus === 'approved' ? 'Approve' : approvalStatus === 'rejected' ? 'Reject' : 'Request Revision'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Details Dialog */}
      <Dialog open={showPlanDetails} onOpenChange={setShowPlanDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Wellness Plan Details</span>
              {selectedPlan && (
                <Badge variant={getStatusVariant(selectedPlan.status) as any}>
                  {selectedPlan.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPlan && (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedPlan.status)}
                  <h3 className="text-xl font-semibold">{selectedPlan.plan_name}</h3>
                </div>
                
                {selectedPlan.plan_description && (
                  <p className="text-muted-foreground">{selectedPlan.plan_description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getApprovalVariant(selectedPlan.user_approval_status) as any}>
                    {selectedPlan.user_approval_status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedPlan.plan_type.replace('_', ' ')}
                  </Badge>
                  {selectedPlan.difficulty_level && (
                    <Badge variant="outline" className="capitalize">
                      {selectedPlan.difficulty_level} difficulty
                    </Badge>
                  )}
                  {selectedPlan.estimated_duration_weeks && (
                    <Badge variant="outline">
                      {selectedPlan.estimated_duration_weeks} weeks
                    </Badge>
                  )}
                </div>
              </div>

              {/* Plan Timeline */}
              {(selectedPlan.target_start_date || selectedPlan.target_end_date) && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPlan.target_start_date && (
                      <div className="p-3 bg-muted rounded">
                        <div className="text-sm text-muted-foreground">Start Date</div>
                        <div className="font-medium">{new Date(selectedPlan.target_start_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    {selectedPlan.target_end_date && (
                      <div className="p-3 bg-muted rounded">
                        <div className="text-sm text-muted-foreground">Target End Date</div>
                        <div className="font-medium">{new Date(selectedPlan.target_end_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Data */}
              {selectedPlan.plan_data && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Plan Details
                  </h4>
                  
                  {/* Executive Summary */}
                  {selectedPlan.plan_data.executive_summary && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded">
                      <h5 className="font-medium mb-2">Executive Summary</h5>
                      <p className="text-sm">{selectedPlan.plan_data.executive_summary}</p>
                    </div>
                  )}

                  {/* Detailed Content */}
                  {selectedPlan.plan_data.detailed_content && (
                    <div className="p-4 bg-muted rounded">
                      <h5 className="font-medium mb-2">Full Plan Content</h5>
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm overflow-x-auto font-sans">
                          {selectedPlan.plan_data.detailed_content}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Routines Summary */}
                  {selectedPlan.plan_data.routines && (
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded">
                      <h5 className="font-medium mb-2">Key Routines</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {selectedPlan.plan_data.routines.exercise && (
                          <div>
                            <div className="font-medium text-green-700 dark:text-green-300">Exercise</div>
                            <div className="text-green-600 dark:text-green-400">
                              {typeof selectedPlan.plan_data.routines.exercise === 'string' 
                                ? selectedPlan.plan_data.routines.exercise
                                : 'Structured exercise program included'
                              }
                            </div>
                          </div>
                        )}
                        {selectedPlan.plan_data.routines.nutrition && (
                          <div>
                            <div className="font-medium text-green-700 dark:text-green-300">Nutrition</div>
                            <div className="text-green-600 dark:text-green-400">
                              {typeof selectedPlan.plan_data.routines.nutrition === 'string' 
                                ? selectedPlan.plan_data.routines.nutrition
                                : 'Nutritional guidelines included'
                              }
                            </div>
                          </div>
                        )}
                        {selectedPlan.plan_data.routines.lifestyle && (
                          <div>
                            <div className="font-medium text-green-700 dark:text-green-300">Lifestyle</div>
                            <div className="text-green-600 dark:text-green-400">
                              {typeof selectedPlan.plan_data.routines.lifestyle === 'string' 
                                ? selectedPlan.plan_data.routines.lifestyle
                                : 'Lifestyle recommendations included'
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  {selectedPlan.plan_data.timeline && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded">
                      <h5 className="font-medium mb-2">Implementation Timeline</h5>
                      <div className="text-sm">
                        {typeof selectedPlan.plan_data.timeline === 'string' 
                          ? selectedPlan.plan_data.timeline
                          : JSON.stringify(selectedPlan.plan_data.timeline, null, 2)
                        }
                      </div>
                    </div>
                  )}

                  {/* Raw Data (fallback) */}
                  {!selectedPlan.plan_data.executive_summary && !selectedPlan.plan_data.detailed_content && !selectedPlan.plan_data.routines && (
                    <div className="p-4 bg-muted rounded">
                      <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
                        {typeof selectedPlan.plan_data === 'string' 
                          ? selectedPlan.plan_data 
                          : JSON.stringify(selectedPlan.plan_data, null, 2)
                        }
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* User Feedback */}
              {selectedPlan.user_feedback && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Feedback</h4>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded">
                    <p className="text-sm">{selectedPlan.user_feedback}</p>
                  </div>
                </div>
              )}

              {/* Plan Metadata */}
              <div className="space-y-2">
                <h4 className="font-medium">Plan Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Created</div>
                    <div>{new Date(selectedPlan.created_at).toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Last Updated</div>
                    <div>{new Date(selectedPlan.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Approval Actions for Pending Plans */}
              {selectedPlan.user_approval_status === 'pending' && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Plan Approval</h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setShowPlanDetails(false);
                        setShowApprovalForm(true);
                        setApprovalStatus('approved');
                      }}
                    >
                      Approve Plan
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowPlanDetails(false);
                        setShowApprovalForm(true);
                        setApprovalStatus('rejected');
                      }}
                    >
                      Reject Plan
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPlanDetails(false);
                        setShowApprovalForm(true);
                        setApprovalStatus('needs_revision');
                      }}
                    >
                      Request Revision
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}