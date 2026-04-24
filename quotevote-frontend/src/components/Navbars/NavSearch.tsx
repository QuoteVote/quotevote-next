'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export default function NavSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const isExplorePage = pathname === '/dashboard/explore' || pathname.startsWith('/dashboard/explore');

  // Mirror the explore page: read q from URL when on explore, else start empty
  const urlQ = isExplorePage ? (searchParams.get('q') || '') : '';

  const [inputValue, setInputValue] = useState(urlQ);
  const [focused, setFocused] = useState(false);

  const debouncedQuery = useDebounce(inputValue, 400);

  const isDebouncePending = useMemo(
    () => inputValue !== debouncedQuery && inputValue.length > 0,
    [inputValue, debouncedQuery]
  );

  // When the URL q param changes externally (e.g. body search updated it), sync input
  useEffect(() => {
    if (isExplorePage && !focused) {
      setInputValue(searchParams.get('q') || '');
    }
  }, [searchParams, isExplorePage, focused]);

  // On explore page: push debounced query to URL params (same as body section)
  // On other pages: navigate to explore with query
  useEffect(() => {
    if (!debouncedQuery && !inputValue) return;

    if (isExplorePage) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set('q', debouncedQuery);
      } else {
        params.delete('q');
      }
      router.replace(`/dashboard/explore?${params.toString()}`);
    } else if (debouncedQuery) {
      router.push(`/dashboard/explore?q=${encodeURIComponent(debouncedQuery)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const clearSearch = () => {
    setInputValue('');
    if (isExplorePage) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('q');
      router.replace(`/dashboard/explore?${params.toString()}`);
    }
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-[38px] rounded-full px-3.5 transition-all duration-200 border',
        focused
          ? 'bg-white border-[#52b274] shadow-[0_0_0_3px_rgba(82,178,116,0.15)] w-[280px]'
          : 'bg-[#f0f2f5] border-transparent hover:bg-[#e4e6eb] w-[220px]'
      )}
    >
      <Search
        className={cn(
          'size-[15px] flex-shrink-0 transition-colors',
          focused ? 'text-[#52b274]' : 'text-gray-500'
        )}
      />
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search…"
        className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none border-none w-full"
      />
      {isDebouncePending ? (
        <Loader2 className="size-3.5 flex-shrink-0 animate-spin text-gray-400" />
      ) : inputValue ? (
        <button
          type="button"
          onClick={clearSearch}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer border-0 bg-transparent p-0"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
