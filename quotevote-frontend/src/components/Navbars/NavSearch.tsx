'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export default function NavSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);

  const debouncedQuery = useDebounce(inputValue, 400);

  const isDebouncePending = useMemo(
    () => inputValue !== debouncedQuery && inputValue.length > 0,
    [inputValue, debouncedQuery]
  );

  // Home (`/`) has its own search in the directory toolbar, so the nav search is hidden there.
  // Other pages: navigate to home with the query.
  useEffect(() => {
    if (debouncedQuery) {
      router.push(`/?q=${encodeURIComponent(debouncedQuery)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  if (pathname === '/') return null;

  const clearSearch = () => {
    setInputValue('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 h-[38px] w-full rounded-full px-3.5 transition-all duration-200 border',
        focused
          ? 'bg-white dark:bg-card border-[#52b274] shadow-[0_0_0_3px_rgba(82,178,116,0.15)]'
          : 'bg-[#f0f2f5] dark:bg-muted border-transparent hover:bg-[#e4e6eb] dark:hover:bg-muted/70'
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
        className="bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none border-none w-full"
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
