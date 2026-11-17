"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { ColorSwatches } from "@/components/AvatarEditor/ColorSwatches";
import { EditorSection, SubLabel } from "@/components/AvatarEditor/EditorSection";
import { OptionGrid } from "@/components/AvatarEditor/OptionGrid";
import { ACCESSORY_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_GROUPS, labelFor } from "@/lib/avatarOptions";
import { cn } from "@/lib/utils";
import type { AvatarOption, AvatarTabProps, HairFilterProps, OptionGridItem } from "@/types/avatar";

const ALL = "all";
const TOTAL = HAIR_GROUPS.reduce((sum, group) => sum + group.options.length, 0);
export const TILE_COLS = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

export function toItems(
  options: AvatarOption[],
  key: keyof AvatarTabProps["draft"],
  draft: AvatarTabProps["draft"]
): OptionGridItem[] {
  return options.map((o) => ({ ...o, preview: { ...draft, [key]: o.value } }));
}

function HairFilter({ filter, query, onFilter, onQuery }: HairFilterProps): ReactNode {
  const chips = [{ id: ALL, label: "All", count: TOTAL }].concat(
    HAIR_GROUPS.map((g) => ({ id: g.id, label: g.label, count: g.options.length }))
  );
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--ae-line-3)] pb-4.5 lg:flex-row lg:items-center lg:gap-2.5">
      <label className="flex h-[38px] w-full items-center gap-2 rounded-[10px] border border-[var(--ae-line-2)] px-3 text-[13.5px] text-[var(--ae-muted-2)] focus-within:border-[var(--ae-green)] lg:w-[220px]">
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">Search hairstyles</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search styles"
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-[var(--ae-ink)] outline-none placeholder:text-[var(--ae-muted-2)]"
        />
      </label>
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
        role="group"
        aria-label="Hairstyle groups"
      >
        {chips.map((chip) => {
          const on = chip.id === filter;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={on}
              onClick={() => onFilter(chip.id)}
              className={cn(
                "inline-flex h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold whitespace-nowrap",
                on
                  ? "border-[var(--ae-ink)] bg-[var(--ae-ink)] text-[var(--ae-surface)]"
                  : "border-[var(--ae-line)] bg-[var(--ae-surface)] text-[var(--ae-ink-2)]"
              )}
            >
              {chip.label}
              <span className={cn("font-semibold", on ? "opacity-70" : "text-[var(--ae-muted-2)]")}>
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Hair tab: grouped hairstyles with search and filter, hair color, glasses. */
export function HairTab({ draft, set }: AvatarTabProps): ReactNode {
  const [filter, setFilter] = useState(ALL);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const groups = HAIR_GROUPS.filter((g) => filter === ALL || g.id === filter)
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q)) }))
    .filter((g) => g.options.length > 0);
  const title =
    filter === ALL ? "Hairstyle" : (HAIR_GROUPS.find((g) => g.id === filter)?.label ?? "Hairstyle");

  return (
    <>
      <HairFilter filter={filter} query={query} onFilter={setFilter} onQuery={setQuery} />
      <EditorSection title={title} value={labelFor("topType", draft.topType)}>
        {groups.length === 0 && (
          <p className="text-sm text-[var(--ae-muted)]">No hairstyles match “{query.trim()}”.</p>
        )}
        {groups.map((group) => (
          <div key={group.id} className="mt-[18px] first:mt-0">
            {filter === ALL && <SubLabel>{group.label}</SubLabel>}
            <OptionGrid
              label={`${group.label} hairstyles`}
              items={toItems(group.options, "topType", draft)}
              value={draft.topType}
              onChange={(topType) => set({ topType })}
              crop="head"
              height={88}
              colsClassName={TILE_COLS}
            />
          </div>
        ))}
      </EditorSection>
      <EditorSection title="Hair color" value={labelFor("hairColor", draft.hairColor)}>
        <ColorSwatches
          label="Hair color"
          options={HAIR_COLOR_OPTIONS}
          value={draft.hairColor}
          onChange={(hairColor) => set({ hairColor })}
        />
      </EditorSection>
      <EditorSection title="Glasses" value={labelFor("accessoriesType", draft.accessoriesType)}>
        <OptionGrid
          label="Glasses"
          items={toItems(ACCESSORY_OPTIONS, "accessoriesType", draft)}
          value={draft.accessoriesType}
          onChange={(accessoriesType) => set({ accessoriesType })}
          crop="face"
          height={72}
          colsClassName="grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7"
        />
      </EditorSection>
    </>
  );
}
