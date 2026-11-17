"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export default function NavSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === "/";
  const urlQuery = isHome ? searchParams.get("q") || "" : "";
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState(urlQuery);
  const [focused, setFocused] = useState(false);

  // When the search is cleared elsewhere (a filter chip, Clear all), empty the box too.
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    if (!urlQuery && inputValue) setInputValue("");
  }

  const debouncedQuery = useDebounce(inputValue, 400);

  const isDebouncePending = useMemo(
    () => inputValue !== debouncedQuery && inputValue.length > 0,
    [inputValue, debouncedQuery]
  );

  // Other pages: go home with the query. Home: update `q` and keep the other filters.
  // Below `lg`, home uses the search in its own toolbar, so this box is hidden there.
  useEffect(() => {
    if (!isHome) {
      if (debouncedQuery) router.push(`/?q=${encodeURIComponent(debouncedQuery)}`);
      return;
    }
    const next = debouncedQuery.trim();
    if (next === urlQuery) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // "/" focuses the search from anywhere on the page, unless the user is typing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      // Hidden on home below `lg`, where the toolbar search is used instead.
      if (isHome && !window.matchMedia?.("(min-width: 1024px)").matches) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHome]);

  const clearSearch = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div
      role="search"
      className={cn(
        isHome ? "hidden lg:flex" : "flex",
        "h-11 w-full items-center gap-2.5 rounded-[var(--shell-radius)] pr-2 pl-4 transition-shadow duration-150",
        "border-[length:var(--shell-border-w)] border-[var(--shell-field-line)] bg-[var(--shell-field)]",
        focused && "shadow-[var(--shell-focus)]"
      )}
    >
      <Search className="size-[18px] flex-shrink-0 text-[var(--shell-muted)]" aria-hidden="true" />
      <label htmlFor="nav-search" className="sr-only">
        Search
      </label>
      <input
        id="nav-search"
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search quotes, people and topics"
        className="w-full border-none bg-transparent text-base text-[var(--shell-ink)] outline-none placeholder:text-[var(--shell-muted)] md:text-[14.5px]"
      />
      {isDebouncePending ? (
        <Loader2 className="size-3.5 flex-shrink-0 animate-spin text-[var(--shell-muted)]" />
      ) : inputValue ? (
        <button
          type="button"
          onClick={clearSearch}
          className="inline-flex size-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[var(--shell-muted)] hover:text-[var(--shell-ink)]"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="rounded-md border border-[var(--shell-key-line)] bg-[var(--shell-key-bg)] px-[7px] py-0.5 font-sans text-xs font-bold text-[var(--shell-muted)]"
        >
          /
        </kbd>
      )}
    </div>
  );
}
