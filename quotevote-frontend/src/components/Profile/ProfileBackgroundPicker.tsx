"use client";

import {
  PROFILE_BG_COLORS,
  PROFILE_BG_COLOR_NAMES,
  PROFILE_BG_PATTERNS,
  getProfileBackgroundStyle,
} from "@/lib/utils/profileBackground";
import type { ProfileBackgroundPickerProps } from "@/types/profile";

/* Banner colour and pattern, from the approved design (Edit profile): six swatches,
   a custom colour and five patterns shown in the chosen colour. */
export function ProfileBackgroundPicker({
  color,
  pattern,
  onColorChange,
  onPatternChange,
}: ProfileBackgroundPickerProps) {
  const current = color.toLowerCase();
  const isPreset = PROFILE_BG_COLORS.includes(current);

  return (
    <>
      <span className="qv-auth-label" id="banner-color-label">
        Color
      </span>
      <div
        className="flex flex-wrap items-center gap-2.5"
        role="radiogroup"
        aria-labelledby="banner-color-label"
      >
        {PROFILE_BG_COLORS.map((swatch) => {
          const on = swatch === current;
          return (
            <button
              key={swatch}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={PROFILE_BG_COLOR_NAMES[swatch] ?? swatch}
              onClick={() => onColorChange(swatch)}
              className="size-10 cursor-pointer rounded-[12px] border-2 border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--auth-focus-line)] [.neo-brutalism_&]:rounded-[4px]"
              style={{
                background: swatch,
                boxShadow: on ? "0 0 0 3px #16201b" : "0 0 0 1px #d6d3c8",
              }}
            />
          );
        })}
        <span className="mx-1 h-[30px] w-px bg-[#d6d3c8]" aria-hidden="true" />
        <label
          className="qv-auth-btn qv-auth-btn-sm relative cursor-pointer gap-2 focus-within:shadow-[var(--auth-btn-focus)]"
          style={!isPreset ? { boxShadow: "0 0 0 3px #16201b" } : undefined}
        >
          <span
            className="size-[18px] rounded-[5px]"
            style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
            aria-hidden="true"
          />
          Custom
          <input
            type="color"
            aria-label="Custom banner color"
            value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#0f7d56"}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>

      <span className="qv-auth-label" id="banner-pattern-label">
        Pattern
      </span>
      <div className="flex flex-wrap gap-3.5" role="group" aria-labelledby="banner-pattern-label">
        {PROFILE_BG_PATTERNS.map((p) => {
          const on = p.value === pattern;
          return (
            <button
              key={p.value}
              type="button"
              aria-pressed={on}
              onClick={() => onPatternChange(p.value)}
              className="flex cursor-pointer flex-col items-center gap-1.5 border-0 bg-transparent text-[12.5px] font-semibold text-[#2a3530] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--auth-focus-line)] [.dark_&]:text-[var(--auth-ink-2)]"
            >
              <span
                className="h-12 w-[72px] rounded-[12px] border-2 [.neo-brutalism_&]:rounded-[4px]"
                style={{
                  ...getProfileBackgroundStyle(color, p.value, 16),
                  borderColor: on ? "#16201b" : "transparent",
                  boxShadow: on ? "inset 0 0 0 3px #fff" : undefined,
                }}
                aria-hidden="true"
              />
              {p.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
