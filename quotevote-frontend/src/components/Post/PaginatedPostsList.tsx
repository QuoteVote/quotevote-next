'use client';

import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_TOP_POSTS } from '@/graphql/queries';
import PostCard from './PostCard';
import { PostSkeleton } from './PostSkeleton';
import { PaginatedList } from '@/components/common/PaginatedList';
import { createGraphQLVariables, extractPaginationData } from '@/lib/pagination';
import { usePagination } from '@/hooks/usePagination';

interface PaginatedPostsListProps {
    defaultPageSize?: number;
    pageParam?: string;
    pageSizeParam?: string;
    searchKey?: string;
    startDateRange?: string;
    endDateRange?: string;
    friendsOnly?: boolean;
    interactions?: boolean;
    userId?: string;
    sortOrder?: string;
    groupId?: string;
    approved?: number;
    cols?: number;
    showPageInfo?: boolean;
    showFirstLast?: boolean;
    maxVisiblePages?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onRefresh?: () => void;
    onTotalCountChange?: (totalCount: number) => void;
    className?: string;
    contentClassName?: string;
    paginationClassName?: string;
}

export default function PaginatedPostsList({
    defaultPageSize = 20,
    pageParam = 'page',
    pageSizeParam = 'page_size',
    searchKey = '',
    startDateRange,
    endDateRange,
    friendsOnly = false,
    interactions = false,
    userId,
    sortOrder,
    groupId,
    approved,
    showPageInfo = true,
    showFirstLast = true,
    maxVisiblePages = 5,
    onPageChange,
    onPageSizeChange,
    onTotalCountChange,
    className,
    contentClassName,
    ...otherProps
}: PaginatedPostsListProps) {

    const pagination = usePagination({
        defaultPageSize,
        pageParam,
        pageSizeParam,
        onPageChange,
        onPageSizeChange,
    });

    const variables = createGraphQLVariables({
        page: pagination.currentPage,
        pageSize: pagination.pageSize,
        searchKey,
        startDateRange,
        endDateRange,
        friendsOnly,
        interactions,
        userId,
        sortOrder,
        groupId,
        approved,
    });



    const { loading, error, data, refetch } = useQuery(GET_TOP_POSTS, {
        variables,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    useEffect(() => {
        if (pagination.currentPage > 1 && (!data || !(data as any).posts)) {
            refetch();
        }
    }, [pagination.currentPage, data, refetch]);

    const { entities, pagination: paginationData } = extractPaginationData(data, 'posts');

    useEffect(() => {
        if (onTotalCountChange && paginationData.total_count !== undefined) {
            onTotalCountChange(paginationData.total_count);
        }
    }, [paginationData.total_count, onTotalCountChange]);

    const renderPost = (post: any) => (
        <div key={post._id} className="w-full mb-6">
            <PostCard
                {...post}
            // user={user} // Pass user if needed
            />
        </div>
    );

    const renderLoading = () => (
        <div className="flex flex-col gap-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
        </div>
    );

    return (
        <PaginatedList
            data={entities}
            loading={loading}
            error={error}
            totalCount={paginationData.total_count}
            defaultPageSize={defaultPageSize}
            pageParam={pageParam}
            pageSizeParam={pageSizeParam}
            showPageInfo={showPageInfo}
            showFirstLast={showFirstLast}
            maxVisiblePages={maxVisiblePages}
            renderItem={renderPost}
            renderLoading={renderLoading}
            onRefresh={refetch}
            className={className}
            contentClassName={contentClassName}
            {...otherProps}
        />
    );
}
