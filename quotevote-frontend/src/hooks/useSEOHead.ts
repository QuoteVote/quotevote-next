'use client';

import { useEffect } from 'react';
import type { SEOHeadProps } from '@/types/components';

/**
 * useSEOHead Hook
 * 
 * Hook for managing SEO meta tags including pagination.
 * Uses native DOM manipulation instead of react-helmet.
 * 
 * NOTE: For Next.js 16, the preferred approach is to use the Metadata API
 * in page.tsx or layout.tsx files. This hook is provided for cases where
 * client-side dynamic SEO updates are needed.
 * 
 * @example
 * ```tsx
 * 'use client'
 * import { useSEOHead } from '@/hooks/useSEOHead'
 * 
 * export default function Page() {
 *   useSEOHead({
 *     title: 'My Page',
 *     description: 'Page description',
 *   })
 *   return <div>...</div>
 * }
 * ```
 */
export function useSEOHead({
  title,
  description,
  canonicalUrl,
  prevUrl,
  nextUrl,
  keywords,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (selector: string, content: string, attribute = 'content') => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, content);
      } else {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          const match = selector.match(/meta\[name="([^"]+)"/);
          if (match) {
            const name = match[1];
            element.setAttribute('name', name);
          }
        } else if (selector.startsWith('meta[property=')) {
          const match = selector.match(/meta\[property="([^"]+)"/);
          if (match) {
            const property = match[1];
            element.setAttribute('property', property);
          }
        }
        element.setAttribute(attribute, content);
        document.head.appendChild(element);
      }
    };

    // Helper function to update or create link tag
    const updateLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (element) {
        element.setAttribute('href', href);
      } else {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        element.setAttribute('href', href);
        document.head.appendChild(element);
      }
    };

    // Update basic meta tags
    if (description) {
      updateMetaTag('meta[name="description"]', description);
    }
    if (keywords) {
      updateMetaTag('meta[name="keywords"]', keywords);
    }

    // Update canonical URL
    if (canonicalUrl) {
      updateLinkTag('canonical', canonicalUrl);
    }

    // Update pagination links
    if (prevUrl) {
      updateLinkTag('prev', prevUrl);
    }
    if (nextUrl) {
      updateLinkTag('next', nextUrl);
    }

    // Update Open Graph tags
    if (title) {
      updateMetaTag('meta[property="og:title"]', title);
    }
    if (description) {
      updateMetaTag('meta[property="og:description"]', description);
    }
    if (canonicalUrl) {
      updateMetaTag('meta[property="og:url"]', canonicalUrl);
    }
    if (ogImage) {
      updateMetaTag('meta[property="og:image"]', ogImage);
    }
    updateMetaTag('meta[property="og:type"]', ogType);

    // Update Twitter Card tags
    if (title) {
      updateMetaTag('meta[name="twitter:title"]', title);
    }
    if (description) {
      updateMetaTag('meta[name="twitter:description"]', description);
    }
    if (ogImage) {
      updateMetaTag('meta[name="twitter:image"]', ogImage);
    }
    updateMetaTag('meta[name="twitter:card"]', 'summary_large_image');

    // Update robots meta
    if (noIndex) {
      updateMetaTag('meta[name="robots"]', 'noindex, nofollow');
    }

    // Cleanup function to remove dynamic meta tags when component unmounts
    return () => {
      // Remove pagination links
      const prevLink = document.querySelector('link[rel="prev"]');
      if (prevLink) {
        prevLink.remove();
      }
      const nextLink = document.querySelector('link[rel="next"]');
      if (nextLink) {
        nextLink.remove();
      }
    };
  }, [title, description, canonicalUrl, prevUrl, nextUrl, keywords, ogImage, ogType, noIndex]);
}

/**
 * SEOHead Component (Legacy compatibility)
 * 
 * Component wrapper for useSEOHead hook.
 * This component doesn't render anything visible.
 * 
 * @deprecated Prefer using useSEOHead hook directly or Next.js Metadata API
 */
export function SEOHead(props: SEOHeadProps) {
  useSEOHead(props);
  return null;
}

