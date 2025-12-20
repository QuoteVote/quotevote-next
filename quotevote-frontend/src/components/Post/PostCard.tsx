'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import type { PostCreator, PostVote, PostComment, PostQuote, PostMessageRoom } from '@/types/post';

// Simple string limit function
const stringLimit = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '...';
};

const GET_GROUP = gql`
  query getGroup($groupId: String!) {
    group(groupId: $groupId) {
      _id
      title
    }
  }
`;

interface GroupQueryData {
    group: {
        _id: string;
        title: string;
    };
}

interface PostCardProps {
    _id: string;
    text?: string | null;
    title?: string | null;
    url?: string | null;
    bookmarkedBy?: string[] | null;
    approvedBy?: string[] | null;
    rejectedBy?: string[] | null;
    created: string;
    creator?: PostCreator | null;
    activityType?: string;
    limitText?: boolean;
    votes?: PostVote[] | null;
    comments?: PostComment[] | null;
    quotes?: PostQuote[] | null;
    messageRoom?: PostMessageRoom | null;
    groupId?: string | null;
}

export default function PostCard(props: PostCardProps) {
    const router = useRouter();
    const {

        text = '',
        title = '',
        url,
        approvedBy = [],
        rejectedBy = [],
        created,
        creator,
        activityType = 'POSTED',
        limitText,
        votes = [],
        comments = [],
        quotes = [],
        messageRoom,
        groupId,
    } = props;

    const [isExpanded, setIsExpanded] = useState(false);

    const { messages = [] } = messageRoom || {};
    const contentLimit = limitText ? 20 : 200;
    const isContentTruncated = text && text.length > contentLimit;
    const shouldShowButton = isContentTruncated && !limitText;

    const postText = isExpanded || !shouldShowButton ? text : stringLimit(text, contentLimit);

    const interactionsCount = (comments?.length || 0) + (votes?.length || 0) + (quotes?.length || 0) + (messages?.length || 0);

    const { data: groupData, loading: groupLoading } = useQuery<GroupQueryData>(GET_GROUP, {
        variables: { groupId },
        skip: !groupId,
        errorPolicy: 'all',
    });

    const handleCardClick = () => {
        if (url) {
            router.push(url.replace(/\?/g, ''));
        }
    };

    const handleShowMoreToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleRedirectToProfile = (username: string) => {
        router.push(`/profile/${username}`);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
    };

    // Determine border color based on activity type (simplified)
    const getBorderColor = (type: string) => {
        switch (type.toUpperCase()) {
            case 'POSTED': return 'border-blue-400';
            case 'COMMENTED': return 'border-yellow-400';
            case 'UPVOTED': return 'border-green-400';
            case 'DOWNVOTED': return 'border-red-400';
            default: return 'border-gray-200';
        }
    };

    return (
        <Card
            className={cn(
                "mb-4 cursor-pointer hover:shadow-md transition-shadow border-l-4",
                getBorderColor(activityType)
            )}
            onClick={handleCardClick}
        >
            <CardContent className="p-4">
                {/* Vote Counts & Interactions */}
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <ArrowUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">{approvedBy?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <ArrowDown className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium">{rejectedBy?.length || 0}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        <span>{interactionsCount} interactions</span>
                    </div>
                </div>

                {/* Title & Group */}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                    {groupId && (
                        <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                            #{groupData?.group?.title || (groupLoading ? 'Loading...' : 'GROUP')}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {postText}
                    </p>
                    {shouldShowButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700 p-0 h-auto mt-2 font-medium"
                            onClick={handleShowMoreToggle}
                        >
                            {isExpanded ? 'Show Less' : 'Show More'}
                        </Button>
                    )}
                </div>

                {/* Footer: Profile & Date */}
                <div className="flex items-center gap-3 mt-4 pt-2 border-t">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (creator?.username) handleRedirectToProfile(creator.username);
                        }}
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                            <Avatar className="h-8 w-8">
                                <AvatarImage
                                    src={typeof creator?.avatar === 'string' ? creator.avatar : creator?.avatar?.url || undefined}
                                    alt={creator?.username || ''}
                                />
                                <AvatarFallback>{creator?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {creator?.username || 'Anonymous'}
                        </span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500">
                        {formatDate(created)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
