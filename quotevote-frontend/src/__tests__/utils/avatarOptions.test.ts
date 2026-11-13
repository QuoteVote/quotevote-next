/**
 * Avatar editor catalogue (#656): the options shown match the approved design and every
 * value is one Avataaars accepts.
 */
import {
  ACCESSORY_OPTIONS,
  AVATAAARS_VALUES,
  AVATAR_KEYS,
  CLOTHE_OPTIONS,
  COLOR_PRESETS,
  EYEBROW_OPTIONS,
  EYE_OPTIONS,
  FABRIC_OPTIONS,
  FACIAL_HAIR_COLOR_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  GRAPHIC_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_GROUPS,
  HEADWEAR_COLOR_OPTIONS,
  MOOD_OPTIONS,
  MOUTH_OPTIONS,
  SHUFFLE_GROUPS,
  SHUFFLE_POOL,
  SKIN_OPTIONS,
  labelFor,
} from "@/lib/avatarOptions";
import type { AvatarKey, AvatarOption } from "@/types/avatar";

const expectValid = (key: AvatarKey, options: AvatarOption[]): void => {
  const values = options.map((o) => o.value);
  expect(new Set(values).size).toBe(values.length);
  values.forEach((v) => expect(AVATAAARS_VALUES[key]).toContain(v));
};

describe("avatar option catalogue", () => {
  it("has the 13 saved keys", () => {
    expect(AVATAR_KEYS).toHaveLength(13);
    expect(Object.keys(AVATAAARS_VALUES).sort()).toEqual([...AVATAR_KEYS].sort());
  });

  it("groups all 35 hairstyles the way the design does", () => {
    expect(HAIR_GROUPS.map((g) => [g.label, g.options.length])).toEqual([
      ["Short", 8],
      ["Long", 10],
      ["Locs and textured", 9],
      ["Headwear", 8],
    ]);
    const tops = HAIR_GROUPS.flatMap((g) => g.options);
    expectValid("topType", tops);
    expect(tops.map((o) => o.value).sort()).toEqual([...AVATAAARS_VALUES.topType].sort());
    const textured = HAIR_GROUPS[2]?.options.map((o) => o.label);
    expect(textured).toEqual(
      expect.arrayContaining(["Dreadlocks", "Short dreads", "Twists", "Afro", "Afro puff band"])
    );
  });

  it("shows the design's option counts with valid values", () => {
    expectValid("accessoriesType", ACCESSORY_OPTIONS);
    expectValid("hairColor", HAIR_COLOR_OPTIONS);
    expectValid("facialHairColor", FACIAL_HAIR_COLOR_OPTIONS);
    expectValid("skinColor", SKIN_OPTIONS);
    expectValid("clotheColor", FABRIC_OPTIONS);
    expectValid("hatColor", HEADWEAR_COLOR_OPTIONS);
    expectValid("clotheType", CLOTHE_OPTIONS);
    expectValid("graphicType", GRAPHIC_OPTIONS);
    expectValid("eyeType", EYE_OPTIONS);
    expectValid("eyebrowType", EYEBROW_OPTIONS);
    expectValid("mouthType", MOUTH_OPTIONS);
    expectValid("facialHairType", FACIAL_HAIR_OPTIONS);
    expect(
      [
        ACCESSORY_OPTIONS,
        HAIR_COLOR_OPTIONS,
        SKIN_OPTIONS,
        FABRIC_OPTIONS,
        HEADWEAR_COLOR_OPTIONS,
        CLOTHE_OPTIONS,
        GRAPHIC_OPTIONS,
        EYE_OPTIONS,
        EYEBROW_OPTIONS,
        MOUTH_OPTIONS,
        FACIAL_HAIR_OPTIONS,
      ].map((l) => l.length)
    ).toEqual([7, 10, 7, 15, 10, 9, 10, 12, 8, 10, 6]);
  });

  it("keeps moods and presets to valid values", () => {
    expect(MOOD_OPTIONS.map((m) => m.label)).toEqual([
      "Cheerful",
      "Confident",
      "Playful",
      "Curious",
      "Amazed",
      "Calm",
    ]);
    MOOD_OPTIONS.forEach(({ values }) => {
      expect(AVATAAARS_VALUES.eyeType).toContain(values.eyeType);
      expect(AVATAAARS_VALUES.eyebrowType).toContain(values.eyebrowType);
      expect(AVATAAARS_VALUES.mouthType).toContain(values.mouthType);
    });
    expect(COLOR_PRESETS).toHaveLength(5);
    COLOR_PRESETS.forEach(({ values }) => {
      expect(AVATAAARS_VALUES.clotheColor).toContain(values.clotheColor);
      expect(AVATAAARS_VALUES.hairColor).toContain(values.hairColor);
    });
  });

  it("shuffles only from friendly values and covers every key once", () => {
    AVATAR_KEYS.forEach((key) => {
      expect(SHUFFLE_POOL[key].length).toBeGreaterThan(0);
      SHUFFLE_POOL[key].forEach((v) => expect(AVATAAARS_VALUES[key]).toContain(v));
    });
    expect(SHUFFLE_POOL.mouthType).not.toContain("Vomit");
    expect(SHUFFLE_POOL.eyeType).not.toContain("Cry");
    const grouped = Object.values(SHUFFLE_GROUPS).flat().sort();
    expect(grouped).toEqual([...AVATAR_KEYS].sort());
  });

  it("labels values, falling back to a readable name for values the editor doesn't show", () => {
    expect(labelFor("topType", "LongHairDreads")).toBe("Dreadlocks");
    expect(labelFor("mouthType", "ScreamOpen")).toBe("Scream Open");
    expect(labelFor("eyeType", undefined)).toBe("");
  });
});
