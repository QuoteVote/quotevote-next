'use client';

import React from 'react';
import ProfileHeader from './ProfileHeader';
import ReputationDisplay from './ReputationDisplay';
import UserPosts from '../UserPosts/UserPosts';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProfileViewProps {
    handleActivityEvent?: (event: any, newActivityEvent: string[]) => void;
    handleSelectAll?: (event: any, newSelectAll: string) => void;
    selectAll?: string;
    filterState?: any;
    setOffset?: (offset: number) => void;
    profileUser: any;
    limit?: number;
    offset?: number;
    selectedEvent?: string[];
    dispatch?: any;
    loading?: boolean;
}

export default function ProfileView({
    profileUser,
    loading,
}: ProfileViewProps) {

    if (loading) return <LoadingSpinner />;

    if (!profileUser || !profileUser.username) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <h2 className="text-xl font-semibold text-gray-700">Invalid user</h2>
                <Link href="/search">
                    <Button variant="link" className="text-blue-500">Return to homepage</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
            <div className="w-full mb-6">
                <ProfileHeader profileUser={profileUser} />
            </div>

            <div className="w-full space-y-8">
                {profileUser.reputation && (
                    <ReputationDisplay
                        reputation={profileUser.reputation}
                        onRefresh={() => window.location.reload()}
                    />
                )}

                <div className="w-full">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2">Posts</h3>
                    <UserPosts userId={profileUser._id} />
                </div>
            </div>
        </div>
    );
}
