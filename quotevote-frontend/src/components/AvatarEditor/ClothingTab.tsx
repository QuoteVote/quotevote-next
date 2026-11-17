"use client";

import type { ReactNode } from "react";
import { ColorSwatches } from "@/components/AvatarEditor/ColorSwatches";
import { EditorSection } from "@/components/AvatarEditor/EditorSection";
import { toItems } from "@/components/AvatarEditor/HairTab";
import { OptionGrid } from "@/components/AvatarEditor/OptionGrid";
import {
  CLOTHE_OPTIONS,
  COLORED_CLOTHES,
  FABRIC_OPTIONS,
  GRAPHIC_OPTIONS,
  labelFor,
} from "@/lib/avatarOptions";
import type { AvatarTabProps } from "@/types/avatar";

const FIVE = "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5";

/** Clothing tab: outfit, the shirt graphic (graphic tee only) and the outfit color. */
export function ClothingTab({ draft, set }: AvatarTabProps): ReactNode {
  const isGraphicTee = draft.clotheType === "GraphicShirt";
  return (
    <>
      <EditorSection title="Outfit" value={labelFor("clotheType", draft.clotheType)}>
        <OptionGrid
          label="Outfit"
          items={toItems(CLOTHE_OPTIONS, "clotheType", draft)}
          value={draft.clotheType}
          onChange={(clotheType) => set({ clotheType })}
          crop="torso"
          height={88}
          colsClassName={FIVE}
        />
      </EditorSection>
      {isGraphicTee && (
        <EditorSection title="Shirt graphic" note="Shown for the graphic tee">
          <OptionGrid
            label="Shirt graphic"
            items={toItems(GRAPHIC_OPTIONS, "graphicType", draft)}
            value={draft.graphicType}
            onChange={(graphicType) => set({ graphicType })}
            crop="torso"
            height={76}
            colsClassName={FIVE}
          />
        </EditorSection>
      )}
      <EditorSection
        title="Outfit color"
        value={
          COLORED_CLOTHES.has(draft.clotheType)
            ? labelFor("clotheColor", draft.clotheColor)
            : undefined
        }
        note={COLORED_CLOTHES.has(draft.clotheType) ? undefined : "Blazers keep their own color"}
      >
        <ColorSwatches
          label="Outfit color"
          options={FABRIC_OPTIONS}
          value={draft.clotheColor}
          onChange={(clotheColor) => set({ clotheColor })}
        />
      </EditorSection>
    </>
  );
}
