/**
 * Utility functions for pagination
 */

/**
 * Convert page-based pagination to offset-based pagination
 */
export const pageToOffset = (page: number, pageSize: number) => {
    const limit = pageSize;
    const offset = (page - 1) * pageSize;
    return { limit, offset };
};

/**
 * Convert offset-based pagination to page-based pagination
 */
export const offsetToPage = (offset: number, limit: number) => {
    const page = Math.floor(offset / limit) + 1;
    const pageSize = limit;
    return { page, pageSize };
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (totalCount: number, page: number, pageSize: number) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const normalizedPage = Math.min(Math.max(page, 1), totalPages || 1);

    return {
        currentPage: normalizedPage,
        totalPages: Math.max(totalPages, 1),
        totalCount,
        pageSize,
        hasNextPage: normalizedPage < totalPages,
        hasPreviousPage: normalizedPage > 1,
        startIndex: (normalizedPage - 1) * pageSize,
        endIndex: Math.min(normalizedPage * pageSize, totalCount),
    };
};

/**
 * Generate page numbers for pagination display
 */
export const generatePageNumbers = (currentPage: number, totalPages: number, maxVisible = 5) => {
    if (totalPages <= maxVisible) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
};

export interface PaginationParams {
    page: number;
    pageSize: number;
    searchKey?: string;
    startDateRange?: string;
    endDateRange?: string;
    friendsOnly?: boolean;
    interactions?: boolean;
    userId?: string;
    sortOrder?: string;
    groupId?: string;
    approved?: number;
}

/**
 * Create GraphQL variables for paginated queries
 */
export const createGraphQLVariables = (params: PaginationParams) => {
    const {
        page,
        pageSize,
        searchKey = '',
        startDateRange,
        endDateRange,
        friendsOnly = false,
        interactions = false,
        userId,
        sortOrder,
        groupId,
        approved,
    } = params;

    const { limit, offset } = pageToOffset(page, pageSize);

    return {
        limit,
        offset,
        searchKey,
        startDateRange,
        endDateRange,
        friendsOnly,
        interactions,
        userId,
        sortOrder,
        groupId,
        approved,
    };
};

export interface PaginationData {
    total_count: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    entities: T[];
    pagination: PaginationData;
}

/**
 * Extract pagination data from GraphQL response
 */
export const extractPaginationData = <T>(data: Record<string, PaginatedResponse<T>> | undefined | null, entityName: string) => {
    if (!data || !data[entityName]) {
        return {
            entities: [] as T[],
            pagination: {
                total_count: 0,
                limit: 0,
                offset: 0,
            },
        };
    }

    const { entities, pagination } = data[entityName];

    return {
        entities: entities || [],
        pagination: {
            total_count: pagination?.total_count || 0,
            limit: pagination?.limit || 0,
            offset: pagination?.offset || 0,
        },
    };
};
