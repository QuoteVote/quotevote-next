"use client";

import type { ReactNode } from "react";
import { ColorSwatches } from "@/components/AvatarEditor/ColorSwatches";
import { EditorSection } from "@/components/AvatarEditor/EditorSection";
import {
  COLOR_PRESETS,
  FABRIC_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HEADWEAR_COLOR_OPTIONS,
  SKIN_OPTIONS,
  labelFor,
} from "@/lib/avatarOptions";
import { cn } from "@/lib/utils";
import type { AvatarTabProps } from "@/types/avatar";

const hexOf = (value: string, list: { value: string; hex: string }[]): string =>
  list.find((o) => o.value === value)?.hex ?? "#ccc";

/** Colors tab: skin, hair, outfit and headwear colors, plus presets. */
export function ColorsTab({ draft, set }: AvatarTabProps): ReactNode {
  return (
    <>
      <EditorSection title="Skin tone" value={labelFor("skinColor", draft.skinColor)}>
        <ColorSwatches
          label="Skin tone"
          options={SKIN_OPTIONS}
          value={draft.skinColor}
          onChange={(skinColor) => set({ skinColor })}
          size={44}
        />
      </EditorSection>
      <EditorSection title="Hair" value={labelFor("hairColor", draft.hairColor)}>
        <ColorSwatches
          label="Hair color"
          options={HAIR_COLOR_OPTIONS}
          value={draft.hairColor}
          onChange={(hairColor) => set({ hairColor })}
        />
      </EditorSection>
      <EditorSection title="Outfit" value={labelFor("clotheColor", draft.clotheColor)}>
        <ColorSwatches
          label="Outfit color"
          options={FABRIC_OPTIONS}
          value={draft.clotheColor}
          onChange={(clotheColor) => set({ clotheColor })}
        />
      </EditorSection>
      <EditorSection title="Headwear" note="Used with hats, hijab and turban">
        <ColorSwatches
          label="Headwear color"
          options={HEADWEAR_COLOR_OPTIONS}
          value={draft.hatColor}
          onChange={(hatColor) => set({ hatColor })}
        />
      </EditorSection>
      <EditorSection title="Color presets" note="Outfit and hair together">
        <div className="flex flex-wrap gap-2.5" role="group" aria-label="Color presets">
          {COLOR_PRESETS.map((preset) => {
            const on =
              preset.values.clotheColor === draft.clotheColor &&
              preset.values.hairColor === draft.hairColor;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={on}
                onClick={() => set(preset.values)}
                className={cn(
                  "flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border bg-[var(--ae-surface)] pr-3.5 pl-2 text-[13.5px] font-bold text-[var(--ae-ink)]",
                  on
                    ? "border-[var(--ae-green)] shadow-[0_0_0_1px_var(--ae-green)]"
                    : "border-[var(--ae-line)]"
                )}
              >
                <span className="flex" aria-hidden="true">
                  <i
                    className="block size-[22px] rounded-full shadow-[0_0_0_2px_var(--ae-surface)]"
                    style={{ background: hexOf(preset.values.clotheColor, FABRIC_OPTIONS) }}
                  />
                  <i
                    className="-ml-1.5 block size-[22px] rounded-full shadow-[0_0_0_2px_var(--ae-surface)]"
                    style={{ background: hexOf(preset.values.hairColor, HAIR_COLOR_OPTIONS) }}
                  />
                </span>
                {preset.label}
              </button>
            );
          })}
        </div>
      </EditorSection>
    </>
  );
}
