'use client';

import { useState, Suspense } from 'react';
import { Loader } from '@/components/common/Loader';
import { Pagination } from '@/components/common/Pagination';
import { PaginatedList } from '@/components/common/PaginatedList';
import { StickyPaginationWrapper } from '@/components/common/StickyPaginationWrapper';
import { useSEOHead } from '@/hooks/useSEOHead';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Test page content component
 * Separated to allow Suspense boundary
 */
function CommonComponentsTestContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Mock data for testing
  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is item number ${i + 1}`,
  }));

  const pageSize = 10;
  const totalCount = mockData.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const currentData = mockData.slice(startIndex, endIndex);

  // Use SEO hook
  useSEOHead({
    title: 'Common Components Test - QuoteVote',
    description: 'Test page for migrated common components',
    canonicalUrl: '/test/common',
  });

  const handlePageChange = (page: number) => {
    setLoading(true);
    setError(null);
    // Simulate loading
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
    }, 500);
  };

  const handleRefresh = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const simulateError = () => {
    setError(new Error('Simulated error for testing'));
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Common Components Test</h1>
          <p className="text-[var(--color-text-secondary)]">
            Test page for all migrated common components
          </p>
        </div>

        {/* Loader Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Loader Component</h2>
          <div className="space-y-4">
            <div className="relative h-32 border border-[var(--color-gray-light)] rounded-lg">
              <Loader size={40} />
            </div>
            <div className="relative h-32 border border-[var(--color-gray-light)] rounded-lg">
              <Loader size={60} absolutelyPositioned={false} />
            </div>
            <div className="relative h-32 border border-[var(--color-gray-light)] rounded-lg">
              <Loader size={30} loadingLabel="Custom loading text" />
            </div>
          </div>
        </Card>

        {/* Pagination Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pagination Component</h2>
          <div className="space-y-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              showPageInfo={true}
              showFirstLast={true}
              maxVisiblePages={5}
            />
            <div className="text-sm text-[var(--color-text-secondary)]">
              Current page: {currentPage} of {totalPages}
            </div>
          </div>
        </Card>

        {/* StickyPaginationWrapper Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">StickyPaginationWrapper Component</h2>
          <StickyPaginationWrapper
            pagination={
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                showPageInfo={true}
                showFirstLast={true}
                maxVisiblePages={5}
              />
            }
          >
            <div className="space-y-4 p-4">
              <p className="text-[var(--color-text-secondary)]">
                This content is wrapped in StickyPaginationWrapper. The pagination
                should be sticky at the bottom of the viewport.
              </p>
              {currentData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-[var(--color-gray-light)] rounded-lg bg-white"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </StickyPaginationWrapper>
        </Card>

        {/* PaginatedList Test */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">PaginatedList Component</h2>
          <div className="space-y-4 mb-4">
            <div className="flex gap-2">
              <Button
                onClick={simulateError}
                variant="destructive"
                size="sm"
              >
                Simulate Error
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>
          <PaginatedList
            data={loading ? undefined : currentData}
            loading={loading}
            error={error || undefined}
            totalCount={totalCount}
            defaultPageSize={pageSize}
            onPageChange={handlePageChange}
            renderItem={(item) => (
              <div
                key={item.id}
                className="p-4 border border-[var(--color-gray-light)] rounded-lg bg-white mb-2"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            )}
            onRefresh={handleRefresh}
          />
        </Card>

        {/* Component Info */}
        <Card className="p-6 bg-[var(--color-background-off-white)]">
          <h2 className="text-xl font-semibold mb-4">Component Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Loader:</strong> Loading spinner with customizable size and positioning
            </p>
            <p>
              <strong>Pagination:</strong> Page navigation with page numbers and info
            </p>
            <p>
              <strong>StickyPaginationWrapper:</strong> Wrapper that keeps pagination sticky at bottom
            </p>
            <p>
              <strong>PaginatedList:</strong> Complete pagination solution with loading/error/empty states
            </p>
            <p>
              <strong>SEOHead:</strong> SEO meta tags management (use useSEOHead hook)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Test page for common components
 * 
 * This page demonstrates and tests all migrated common components:
 * - Loader
 * - Pagination
 * - PaginatedList
 * - StickyPaginationWrapper
 * - SEOHead (useSEOHead hook)
 */
export default function CommonComponentsTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <Loader size={60} />
      </div>
    }>
      <CommonComponentsTestContent />
    </Suspense>
  );
}

