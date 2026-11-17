"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { ColorSwatches } from "@/components/AvatarEditor/ColorSwatches";
import { EditorSection } from "@/components/AvatarEditor/EditorSection";
import { toItems } from "@/components/AvatarEditor/HairTab";
import { OptionGrid } from "@/components/AvatarEditor/OptionGrid";
import {
  EYEBROW_OPTIONS,
  EYE_OPTIONS,
  FACIAL_HAIR_COLOR_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  MOOD_OPTIONS,
  MOUTH_OPTIONS,
  labelFor,
} from "@/lib/avatarOptions";
import type { AvatarTabProps } from "@/types/avatar";

const SIX = "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";

/** The mood whose eyes, eyebrows and mouth all match the draft, if any. */
function currentMood(draft: AvatarTabProps["draft"]): string | undefined {
  return MOOD_OPTIONS.find(
    (m) =>
      m.values.eyeType === draft.eyeType &&
      m.values.eyebrowType === draft.eyebrowType &&
      m.values.mouthType === draft.mouthType
  )?.label;
}

/** Face tab: moods, eyes, eyebrows, mouth and facial hair (with its color once picked). */
export function FaceTab({ draft, set }: AvatarTabProps): ReactNode {
  const hasFacialHair = draft.facialHairType !== "Blank";
  const moods = MOOD_OPTIONS.map((m) => ({
    value: m.label,
    label: m.label,
    preview: { ...draft, ...m.values },
  }));

  return (
    <>
      <EditorSection title="Mood" note="Sets eyes, eyebrows and mouth together">
        <OptionGrid
          label="Mood"
          items={moods}
          value={currentMood(draft)}
          onChange={(label) => {
            const mood = MOOD_OPTIONS.find((m) => m.label === label);
            if (mood) set(mood.values);
          }}
          crop="face"
          height={76}
          colsClassName={SIX}
        />
      </EditorSection>
      <EditorSection title="Eyes" value={labelFor("eyeType", draft.eyeType)}>
        <OptionGrid
          label="Eyes"
          items={toItems(EYE_OPTIONS, "eyeType", draft)}
          value={draft.eyeType}
          onChange={(eyeType) => set({ eyeType })}
          crop="face"
          height={76}
          colsClassName={SIX}
        />
      </EditorSection>
      <EditorSection title="Eyebrows" value={labelFor("eyebrowType", draft.eyebrowType)}>
        <OptionGrid
          label="Eyebrows"
          items={toItems(EYEBROW_OPTIONS, "eyebrowType", draft)}
          value={draft.eyebrowType}
          onChange={(eyebrowType) => set({ eyebrowType })}
          crop="face"
          height={64}
          colsClassName="grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
        />
      </EditorSection>
      <EditorSection title="Mouth" value={labelFor("mouthType", draft.mouthType)}>
        <OptionGrid
          label="Mouth"
          items={toItems(MOUTH_OPTIONS, "mouthType", draft)}
          value={draft.mouthType}
          onChange={(mouthType) => set({ mouthType })}
          crop="face"
          height={76}
          colsClassName="grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
        />
      </EditorSection>
      <EditorSection title="Facial hair" value={labelFor("facialHairType", draft.facialHairType)}>
        <OptionGrid
          label="Facial hair"
          items={toItems(FACIAL_HAIR_OPTIONS, "facialHairType", draft)}
          value={draft.facialHairType}
          onChange={(facialHairType) => set({ facialHairType })}
          crop="face"
          height={76}
          colsClassName={SIX}
        />
        {hasFacialHair ? (
          <div className="mt-4">
            <p className="mb-2.5 text-xs font-bold tracking-[0.06em] text-[var(--ae-muted-2)] uppercase">
              Facial hair color
            </p>
            <ColorSwatches
              label="Facial hair color"
              options={FACIAL_HAIR_COLOR_OPTIONS}
              value={draft.facialHairColor}
              onChange={(facialHairColor) => set({ facialHairColor })}
            />
          </div>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-[13px] font-medium text-[var(--ae-muted)]">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            Facial hair color appears once you pick a beard or moustache.
          </p>
        )}
      </EditorSection>
    </>
  );
}
