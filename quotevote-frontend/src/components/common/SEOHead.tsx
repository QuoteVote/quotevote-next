'use client';

/**
 * SEOHead Component
 * 
 * Component for managing SEO meta tags including pagination.
 * Uses native DOM manipulation instead of react-helmet.
 * 
 * NOTE: For Next.js 16, the preferred approach is to use the Metadata API
 * in page.tsx or layout.tsx files. This component is provided for cases where
 * client-side dynamic SEO updates are needed.
 * 
 * @deprecated Prefer using useSEOHead hook from '@/hooks/useSEOHead' or Next.js Metadata API
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { SEOHead } from '@/components/common/SEOHead'
 * 
 * export default function Page() {
 *   return (
 *     <>
 *       <SEOHead title="My Page" description="Page description" />
 *       <div>...</div>
 *     </>
 *   )
 * }
 * ```
 */
export { SEOHead } from '@/hooks/useSEOHead';

