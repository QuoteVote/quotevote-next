"use client";

import type { FC, FormEvent, ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Search, X, UserPlus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ChatSearchInputProps {
  setSearch: (value: string) => void;
  addBuddyMode?: boolean;
  onAddBuddyModeChange?: (value: boolean) => void;
}

const ChatSearchInput: FC<ChatSearchInputProps> = ({
  setSearch,
  addBuddyMode = false,
  onAddBuddyModeChange,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // When addBuddyMode changes, clear search if exiting add mode
  useEffect(() => {
    if (!addBuddyMode && searchValue) {
      setSearchValue('');
      setSearch('');
    }
  }, [addBuddyMode, searchValue, setSearch]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const searchKey = e.target.value;
    setSearchValue(searchKey);
    setSearch(searchKey);
  };

  const handleClear = () => {
    setSearchValue('');
    setSearch('');
    if (addBuddyMode && onAddBuddyModeChange) {
      onAddBuddyModeChange(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const toggleAddMode = () => {
    if (!onAddBuddyModeChange) return;

    const next = !addBuddyMode;
    onAddBuddyModeChange(next);

    if (next) {
      // When entering add mode, focus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // When exiting add mode, clear search
      setSearchValue('');
      setSearch('');
    }
  };

  const ariaLabel = addBuddyMode
    ? 'search users to add'
    : 'search conversations';

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex items-center rounded-xl border bg-muted/50 px-2 py-1.5 text-sm shadow-sm transition-all',
          'focus-within:border-emerald-500 focus-within:bg-background focus-within:ring-2 focus-within:ring-emerald-500/20',
          addBuddyMode &&
          'border-emerald-500 bg-background ring-2 ring-emerald-500/15'
        )}
      >
        {addBuddyMode && (
          <button
            type="button"
            onClick={toggleAddMode}
            className="mr-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add Buddy</span>
          </button>
        )}

        {!addBuddyMode && onAddBuddyModeChange && (
          <button
            type="button"
            onClick={toggleAddMode}
            className="mr-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900"
            aria-label="add buddy mode"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </button>
        )}

        <Search
          className={cn(
            'mr-1 h-4 w-4 flex-shrink-0 text-muted-foreground',
            addBuddyMode && 'text-emerald-500'
          )}
        />

        <Input
          ref={inputRef}
          className="h-7 flex-1 border-0 bg-transparent px-1 py-0 text-xs focus-visible:ring-0"
          placeholder={
            addBuddyMode
              ? 'Search users to add as buddy...'
              : 'Search conversations...'
          }
          value={searchValue}
          onChange={handleInput}
          aria-label={ariaLabel}
        />

        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="clear search"
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>
    </div>
  );
};

export default ChatSearchInput;
