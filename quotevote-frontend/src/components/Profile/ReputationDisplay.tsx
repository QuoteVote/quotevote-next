'use client';

import {
  Users,
  Shield,
  TrendingUp,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { ReputationDisplayProps } from '@/types/profile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function ReputationDisplay({
  reputation,
  onRefresh,
  loading = false,
}: ReputationDisplayProps) {
  if (!reputation) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No reputation data available</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number): string => {
    if (score >= 800) return '#4caf50'; // Green
    if (score >= 600) return '#ff9800'; // Orange
    if (score >= 400) return '#ff5722'; // Red-Orange
    return '#f44336'; // Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 800) return 'Excellent';
    if (score >= 600) return 'Good';
    if (score >= 400) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const scoreColor = getScoreColor(reputation.overallScore);
  const scoreLabel = getScoreLabel(reputation.overallScore);
  const progressPercentage = (reputation.overallScore / 1000) * 100;

  return (
    <div className="space-y-4">
      {/* Main Reputation Card */}
      <Card
        className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
      >
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Reputation Score</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl font-bold">{reputation.overallScore}</span>
                <span
                  className="px-2 py-1 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: scoreColor }}
                >
                  {scoreLabel}
                </span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: '#4caf50',
                  }}
                />
              </div>
              <p className="text-sm opacity-80">
                Last updated: {formatDate(reputation.lastCalculated)}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={loading}
                    className="text-white hover:bg-white/20"
                  >
                    <RefreshCw
                      className={cn('h-5 w-5', loading && 'animate-spin')}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh reputation</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-primary">
                {reputation.inviteNetworkScore}
              </p>
              <p className="text-sm text-muted-foreground">Invite Network</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 mx-auto mt-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on quality of invited users and acceptance rate</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-primary">
                {reputation.conductScore}
              </p>
              <p className="text-sm text-muted-foreground">Conduct</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 mx-auto mt-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on reports received and voting behavior</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-xl font-bold text-primary">
                {reputation.activityScore}
              </p>
              <p className="text-sm text-muted-foreground">Activity</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 mx-auto mt-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Based on content creation and platform engagement</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalInvitesSent}
              </p>
              <p className="text-sm text-muted-foreground">Invites Sent</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalInvitesAccepted}
              </p>
              <p className="text-sm text-muted-foreground">Invites Accepted</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalPosts}
              </p>
              <p className="text-sm text-muted-foreground">Posts Created</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalComments}
              </p>
              <p className="text-sm text-muted-foreground">Comments Made</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalUpvotes}
              </p>
              <p className="text-sm text-muted-foreground">Upvotes Given</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalReportsReceived}
              </p>
              <p className="text-sm text-muted-foreground">Reports Received</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.averageInviteeReputation.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Avg Invitee Rep</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">
                {reputation.metrics.totalReportsResolved}
              </p>
              <p className="text-sm text-muted-foreground">Reports Resolved</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

