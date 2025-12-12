'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Flag } from 'lucide-react';

interface ProfileHeaderProps {
    profileUser: any;
}

export default function ProfileHeader({ profileUser }: ProfileHeaderProps) {
    const router = useRouter();
    const {
        username,
        _id,
        _followingId,
        _followersId,
        avatar,
    } = profileUser;

    // Mock logged in user
    const loggedInUserId = 'test-user-id';
    const sameUser = _id === loggedInUserId;

    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <Avatar
                        src={avatar?.url}
                        alt={username}
                        fallback={username?.charAt(0).toUpperCase()}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{username}</h1>
                    <div className="flex gap-4 text-sm text-gray-500">
                        <span className="cursor-pointer hover:text-blue-500">
                            <span className="font-bold text-gray-900 dark:text-gray-100 mr-1">{_followersId?.length || 0}</span>
                            Followers
                        </span>
                        <span className="cursor-pointer hover:text-blue-500">
                            <span className="font-bold text-gray-900 dark:text-gray-100 mr-1">{_followingId?.length || 0}</span>
                            Following
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                {sameUser ? (
                    <Button
                        onClick={() => router.push(`/profile/${username}/avatar`)}
                        variant="outline"
                    >
                        Change Photo
                    </Button>
                ) : (
                    <>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Follow
                        </Button>
                        <Button variant="outline" className="gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Message
                        </Button>
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
                            <Flag className="w-4 h-4" />
                            Report
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
