'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Shield,
    Activity,
    RefreshCw,
    Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReputationMetrics {
    totalInvitesSent: number;
    totalInvitesAccepted: number;
    totalInvitesDeclined: number;
    averageInviteeReputation: number;
    totalReportsReceived: number;
    totalReportsResolved: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalPosts: number;
    totalComments: number;
}

interface ReputationData {
    _id: string;
    overallScore: number;
    inviteNetworkScore: number;
    conductScore: number;
    activityScore: number;
    metrics: ReputationMetrics;
    lastCalculated: string;
}

interface ReputationDisplayProps {
    reputation: ReputationData;
    onRefresh?: () => void;
    loading?: boolean;
}

export default function ReputationDisplay({ reputation, onRefresh, loading = false }: ReputationDisplayProps) {
    if (!reputation) {
        return (
            <Card className="mb-4">
                <CardContent className="p-6">
                    <p className="text-gray-500">No reputation data available</p>
                </CardContent>
            </Card>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 800) return 'bg-green-500';
        if (score >= 600) return 'bg-orange-500';
        if (score >= 400) return 'bg-red-500';
        return 'bg-red-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 800) return 'Excellent';
        if (score >= 600) return 'Good';
        if (score >= 400) return 'Fair';
        return 'Poor';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="space-y-4 mb-6">
            {/* Main Reputation Card */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Reputation Score</h3>
                            <div className="flex items-center mb-2">
                                <span className="text-4xl font-bold mr-3">{reputation.overallScore}</span>
                                <Badge className={`${getScoreColor(reputation.overallScore)} text-white border-none`}>
                                    {getScoreLabel(reputation.overallScore)}
                                </Badge>
                            </div>
                            <div className="w-full bg-white/30 h-2 rounded-full mb-2">
                                <div
                                    className="bg-green-400 h-2 rounded-full"
                                    style={{ width: `${(reputation.overallScore / 1000) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-80">
                                Last updated: {formatDate(reputation.lastCalculated)}
                            </p>
                        </div>
                        <div>
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
                                            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Refresh reputation</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle>Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {reputation.inviteNetworkScore}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                                Invite Network
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Based on quality of invited users and acceptance rate</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Shield className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {reputation.conductScore}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                                Conduct
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Based on reports received and voting behavior</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Activity className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {reputation.activityScore}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                                Activity
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Based on content creation and platform engagement</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Detailed Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <MetricItem label="Invites Sent" value={reputation.metrics.totalInvitesSent} />
                        <MetricItem label="Invites Accepted" value={reputation.metrics.totalInvitesAccepted} />
                        <MetricItem label="Posts Created" value={reputation.metrics.totalPosts} />
                        <MetricItem label="Comments Made" value={reputation.metrics.totalComments} />
                        <MetricItem label="Upvotes Given" value={reputation.metrics.totalUpvotes} />
                        <MetricItem label="Reports Received" value={reputation.metrics.totalReportsReceived} />
                        <MetricItem label="Avg Invitee Rep" value={reputation.metrics.averageInviteeReputation} />
                        <MetricItem label="Reports Resolved" value={reputation.metrics.totalReportsResolved} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function MetricItem({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
        </div>
    );
}
