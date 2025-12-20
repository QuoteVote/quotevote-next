'use client';

import { useEffect } from 'react';
import PaginatedPostsList from '../Post/PaginatedPostsList';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface UserPostsProps {
    userId: string;
}

export default function UserPosts({ userId }: UserPostsProps) {

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <ErrorBoundary>
            <div className="flex flex-col items-center w-full">
                <div className="w-full mb-2">
                    <PaginatedPostsList
                        userId={userId}
                        defaultPageSize={15}
                        pageParam="page"
                        pageSizeParam="page_size"
                        cols={1}
                        showPageInfo={true}
                        showFirstLast={true}
                        maxVisiblePages={5}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
}
