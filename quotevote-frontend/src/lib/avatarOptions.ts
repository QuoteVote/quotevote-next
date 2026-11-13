/**
 * Avataaars option catalogue for the avatar editor (#656).
 *
 * `AVATAAARS_VALUES` lists every value Avataaars accepts for each saved key. It is the
 * whitelist used when reading, saving and rendering avatars.
 * The `*_OPTIONS` lists are what the editor shows, with friendly labels, in the order of
 * the approved design. A saved value that the editor doesn't show is kept until the
 * member picks something else.
 */

import type {
  AvatarKey,
  AvatarOption,
  ColorOption,
  ColorPreset,
  HairGroup,
  MoodOption,
  ShuffleGroup,
} from "@/types/avatar";

export const AVATAR_KEYS: readonly AvatarKey[] = [
  "topType",
  "accessoriesType",
  "hatColor",
  "hairColor",
  "facialHairType",
  "facialHairColor",
  "clotheType",
  "clotheColor",
  "graphicType",
  "eyeType",
  "eyebrowType",
  "mouthType",
  "skinColor",
];

const FABRIC_VALUES = [
  "Black",
  "Blue01",
  "Blue02",
  "Blue03",
  "Gray01",
  "Gray02",
  "Heather",
  "PastelBlue",
  "PastelGreen",
  "PastelOrange",
  "PastelRed",
  "PastelYellow",
  "Pink",
  "Red",
  "White",
];

export const AVATAAARS_VALUES: Record<AvatarKey, readonly string[]> = {
  topType: [
    "NoHair",
    "Eyepatch",
    "Hat",
    "Hijab",
    "Turban",
    "WinterHat1",
    "WinterHat2",
    "WinterHat3",
    "WinterHat4",
    "LongHairBigHair",
    "LongHairBob",
    "LongHairBun",
    "LongHairCurly",
    "LongHairCurvy",
    "LongHairDreads",
    "LongHairFrida",
    "LongHairFro",
    "LongHairFroBand",
    "LongHairNotTooLong",
    "LongHairShavedSides",
    "LongHairMiaWallace",
    "LongHairStraight",
    "LongHairStraight2",
    "LongHairStraightStrand",
    "ShortHairDreads01",
    "ShortHairDreads02",
    "ShortHairFrizzle",
    "ShortHairShaggyMullet",
    "ShortHairShortCurly",
    "ShortHairShortFlat",
    "ShortHairShortRound",
    "ShortHairShortWaved",
    "ShortHairSides",
    "ShortHairTheCaesar",
    "ShortHairTheCaesarSidePart",
  ],
  accessoriesType: [
    "Blank",
    "Kurt",
    "Prescription01",
    "Prescription02",
    "Round",
    "Sunglasses",
    "Wayfarers",
  ],
  hatColor: FABRIC_VALUES,
  hairColor: [
    "Auburn",
    "Black",
    "Blonde",
    "BlondeGolden",
    "Brown",
    "BrownDark",
    "PastelPink",
    "Platinum",
    "Red",
    "SilverGray",
  ],
  facialHairType: [
    "Blank",
    "BeardMedium",
    "BeardLight",
    "BeardMajestic",
    "MoustacheFancy",
    "MoustacheMagnum",
  ],
  facialHairColor: [
    "Auburn",
    "Black",
    "Blonde",
    "BlondeGolden",
    "Brown",
    "BrownDark",
    "Platinum",
    "Red",
  ],
  clotheType: [
    "BlazerShirt",
    "BlazerSweater",
    "CollarSweater",
    "GraphicShirt",
    "Hoodie",
    "Overall",
    "ShirtCrewNeck",
    "ShirtScoopNeck",
    "ShirtVNeck",
  ],
  clotheColor: FABRIC_VALUES,
  graphicType: [
    "Bat",
    "Cumbia",
    "Deer",
    "Diamond",
    "Hola",
    "Pizza",
    "Resist",
    "Selena",
    "Bear",
    "SkullOutline",
    "Skull",
  ],
  eyeType: [
    "Close",
    "Cry",
    "Default",
    "Dizzy",
    "EyeRoll",
    "Happy",
    "Hearts",
    "Side",
    "Squint",
    "Surprised",
    "Wink",
    "WinkWacky",
  ],
  eyebrowType: [
    "Angry",
    "AngryNatural",
    "Default",
    "DefaultNatural",
    "FlatNatural",
    "RaisedExcited",
    "RaisedExcitedNatural",
    "SadConcerned",
    "SadConcernedNatural",
    "UnibrowNatural",
    "UpDown",
    "UpDownNatural",
  ],
  mouthType: [
    "Concerned",
    "Default",
    "Disbelief",
    "Eating",
    "Grimace",
    "Sad",
    "ScreamOpen",
    "Serious",
    "Smile",
    "Tongue",
    "Twinkle",
    "Vomit",
  ],
  skinColor: ["Tanned", "Yellow", "Pale", "Light", "Brown", "DarkBrown", "Black"],
};

const opts = (pairs: [string, string][]): AvatarOption[] =>
  pairs.map(([value, label]) => ({ value, label }));
const colors = (rows: [string, string, string][]): ColorOption[] =>
  rows.map(([value, label, hex]) => ({ value, label, hex }));

export const HAIR_GROUPS: HairGroup[] = [
  {
    id: "short",
    label: "Short",
    options: opts([
      ["ShortHairShortFlat", "Short flat"],
      ["ShortHairShortRound", "Short round"],
      ["ShortHairShortWaved", "Short waves"],
      ["ShortHairTheCaesar", "Caesar"],
      ["ShortHairTheCaesarSidePart", "Side part"],
      ["ShortHairShaggyMullet", "Shaggy mullet"],
      ["ShortHairSides", "Bald, sides"],
      ["NoHair", "Bald"],
    ]),
  },
  {
    id: "long",
    label: "Long",
    options: opts([
      ["LongHairStraight", "Straight"],
      ["LongHairStraight2", "Straight, parted"],
      ["LongHairStraightStrand", "Straight, strand"],
      ["LongHairCurvy", "Wavy"],
      ["LongHairNotTooLong", "Shoulder length"],
      ["LongHairBob", "Bob"],
      ["LongHairMiaWallace", "Blunt bob"],
      ["LongHairBun", "Top bun"],
      ["LongHairShavedSides", "Undercut"],
      ["LongHairFrida", "Flower crown"],
    ]),
  },
  {
    id: "textured",
    label: "Locs and textured",
    options: opts([
      ["LongHairDreads", "Dreadlocks"],
      ["ShortHairDreads01", "Short dreads"],
      ["ShortHairDreads02", "Twists"],
      ["LongHairFro", "Afro"],
      ["LongHairFroBand", "Afro puff band"],
      ["ShortHairFrizzle", "Frizzy top"],
      ["ShortHairShortCurly", "Short curls"],
      ["LongHairCurly", "Long curls"],
      ["LongHairBigHair", "Big curls"],
    ]),
  },
  {
    id: "headwear",
    label: "Headwear",
    options: opts([
      ["Hijab", "Hijab"],
      ["Turban", "Turban"],
      ["Hat", "Hat"],
      ["WinterHat1", "Winter hat"],
      ["WinterHat2", "Winter hat, ties"],
      ["WinterHat3", "Beanie"],
      ["WinterHat4", "Cat-ear beanie"],
      ["Eyepatch", "Eyepatch"],
    ]),
  },
];

/** Tops that show the headwear color. */
export const HEADWEAR_TOPS = new Set([
  "Hijab",
  "Turban",
  "WinterHat1",
  "WinterHat2",
  "WinterHat3",
  "WinterHat4",
]);

export const ACCESSORY_OPTIONS = opts([
  ["Blank", "None"],
  ["Round", "Round"],
  ["Prescription01", "Reading"],
  ["Prescription02", "Square"],
  ["Wayfarers", "Wayfarers"],
  ["Sunglasses", "Sunglasses"],
  ["Kurt", "Shades"],
]);

export const HAIR_COLOR_OPTIONS = colors([
  ["Black", "Black", "#2C1B18"],
  ["BrownDark", "Dark brown", "#4A312C"],
  ["Brown", "Brown", "#724133"],
  ["Auburn", "Auburn", "#A55728"],
  ["Red", "Red", "#C93305"],
  ["Blonde", "Blonde", "#B58143"],
  ["BlondeGolden", "Golden", "#D6B370"],
  ["Platinum", "Platinum", "#ECDCBF"],
  ["SilverGray", "Silver", "#E8E1E1"],
  ["PastelPink", "Pink", "#F59797"],
]);

/** Facial hair takes the hair colors Avataaars supports for beards. */
export const FACIAL_HAIR_COLOR_OPTIONS = HAIR_COLOR_OPTIONS.filter((c) =>
  AVATAAARS_VALUES.facialHairColor.includes(c.value)
);

export const SKIN_OPTIONS = colors([
  ["Pale", "Pale", "#FFDBB4"],
  ["Light", "Light", "#EDB98A"],
  ["Yellow", "Golden", "#F8D25C"],
  ["Tanned", "Tanned", "#FD9841"],
  ["Brown", "Brown", "#D08B5B"],
  ["DarkBrown", "Dark brown", "#AE5D29"],
  ["Black", "Deep", "#614335"],
]);

export const FABRIC_OPTIONS = colors([
  ["Black", "Charcoal", "#262E33"],
  ["Heather", "Heather", "#3C4F5C"],
  ["Gray02", "Gray", "#929598"],
  ["Gray01", "Light gray", "#E6E6E6"],
  ["White", "White", "#FFFFFF"],
  ["Blue03", "Navy", "#25557C"],
  ["Blue02", "Blue", "#5199E4"],
  ["Blue01", "Sky", "#65C9FF"],
  ["PastelBlue", "Powder", "#B1E2FF"],
  ["PastelGreen", "Mint", "#A7FFC4"],
  ["PastelYellow", "Butter", "#FFFFB1"],
  ["PastelOrange", "Peach", "#FFDEB5"],
  ["PastelRed", "Blush", "#FFAFB9"],
  ["Pink", "Pink", "#FF488E"],
  ["Red", "Coral", "#FF5C5C"],
]);

/** The design shows the first ten fabric colors for headwear. */
export const HEADWEAR_COLOR_OPTIONS = FABRIC_OPTIONS.slice(0, 10);

export const CLOTHE_OPTIONS = opts([
  ["Hoodie", "Hoodie"],
  ["ShirtCrewNeck", "Crew neck"],
  ["ShirtVNeck", "V-neck"],
  ["ShirtScoopNeck", "Scoop neck"],
  ["CollarSweater", "Collar sweater"],
  ["BlazerShirt", "Blazer, shirt"],
  ["BlazerSweater", "Blazer, sweater"],
  ["Overall", "Overalls"],
  ["GraphicShirt", "Graphic tee"],
]);

/** Outfits whose color Avataaars draws (blazers keep their own color). */
export const COLORED_CLOTHES = new Set([
  "CollarSweater",
  "GraphicShirt",
  "Hoodie",
  "Overall",
  "ShirtCrewNeck",
  "ShirtScoopNeck",
  "ShirtVNeck",
]);

export const GRAPHIC_OPTIONS = opts([
  ["Bear", "Bear"],
  ["Bat", "Bat"],
  ["Deer", "Deer"],
  ["Diamond", "Diamond"],
  ["Pizza", "Pizza"],
  ["Hola", "Hola"],
  ["Resist", "Resist"],
  ["Cumbia", "Cumbia"],
  ["Selena", "Selena"],
  ["Skull", "Skull"],
]);

export const EYE_OPTIONS = opts([
  ["Default", "Default"],
  ["Happy", "Happy"],
  ["Wink", "Wink"],
  ["Side", "Side glance"],
  ["Squint", "Squint"],
  ["Surprised", "Surprised"],
  ["Hearts", "Hearts"],
  ["Close", "Closed"],
  ["EyeRoll", "Eye roll"],
  ["WinkWacky", "Wacky wink"],
  ["Dizzy", "Dizzy"],
  ["Cry", "Teary"],
]);

export const EYEBROW_OPTIONS = opts([
  ["Default", "Default"],
  ["DefaultNatural", "Natural"],
  ["RaisedExcitedNatural", "Raised"],
  ["FlatNatural", "Flat"],
  ["UpDownNatural", "Skeptical"],
  ["SadConcernedNatural", "Concerned"],
  ["AngryNatural", "Stern"],
  ["UnibrowNatural", "Unibrow"],
]);

export const MOUTH_OPTIONS = opts([
  ["Smile", "Smile"],
  ["Default", "Neutral"],
  ["Twinkle", "Smirk"],
  ["Serious", "Serious"],
  ["Tongue", "Tongue out"],
  ["Eating", "Eating"],
  ["Concerned", "Concerned"],
  ["Disbelief", "Disbelief"],
  ["Sad", "Sad"],
  ["Grimace", "Grimace"],
]);

export const FACIAL_HAIR_OPTIONS = opts([
  ["Blank", "None"],
  ["BeardLight", "Stubble"],
  ["BeardMedium", "Beard"],
  ["BeardMajestic", "Full beard"],
  ["MoustacheFancy", "Curled moustache"],
  ["MoustacheMagnum", "Moustache"],
]);

export const MOOD_OPTIONS: MoodOption[] = [
  {
    label: "Cheerful",
    values: { eyeType: "Happy", eyebrowType: "DefaultNatural", mouthType: "Smile" },
  },
  {
    label: "Confident",
    values: { eyeType: "Default", eyebrowType: "DefaultNatural", mouthType: "Twinkle" },
  },
  {
    label: "Playful",
    values: { eyeType: "Wink", eyebrowType: "RaisedExcitedNatural", mouthType: "Tongue" },
  },
  {
    label: "Curious",
    values: { eyeType: "Side", eyebrowType: "UpDownNatural", mouthType: "Default" },
  },
  {
    label: "Amazed",
    values: { eyeType: "Surprised", eyebrowType: "RaisedExcitedNatural", mouthType: "Disbelief" },
  },
  {
    label: "Calm",
    values: { eyeType: "Close", eyebrowType: "DefaultNatural", mouthType: "Smile" },
  },
];

/** Color presets set the outfit and hair color together. */
export const COLOR_PRESETS: ColorPreset[] = [
  { label: "Classic", values: { clotheColor: "Black", hairColor: "Black" } },
  { label: "Fresh", values: { clotheColor: "PastelGreen", hairColor: "BrownDark" } },
  { label: "Ocean", values: { clotheColor: "Blue03", hairColor: "Black" } },
  { label: "Sunset", values: { clotheColor: "Red", hairColor: "Auburn" } },
  { label: "Pastel", values: { clotheColor: "PastelRed", hairColor: "PastelPink" } },
];

/** Shuffle groups, matching the "Shuffle keeps" locks. */
export const SHUFFLE_GROUPS: Record<ShuffleGroup, readonly AvatarKey[]> = {
  Hair: ["topType", "accessoriesType"],
  Face: ["eyeType", "eyebrowType", "mouthType", "facialHairType"],
  Clothing: ["clotheType", "graphicType"],
  Colors: ["skinColor", "hairColor", "facialHairColor", "clotheColor", "hatColor"],
};

export const SHUFFLE_GROUP_ORDER: ShuffleGroup[] = ["Hair", "Face", "Clothing", "Colors"];

/** Values shuffle picks from: the options shown in the editor, never the odd ones. */
export const SHUFFLE_POOL: Record<AvatarKey, readonly string[]> = {
  topType: HAIR_GROUPS.flatMap((g) => g.options.map((o) => o.value)).filter(
    (v) => v !== "Eyepatch"
  ),
  accessoriesType: ["Blank", "Blank", "Blank", ...ACCESSORY_OPTIONS.slice(1).map((o) => o.value)],
  hatColor: HEADWEAR_COLOR_OPTIONS.map((o) => o.value),
  hairColor: HAIR_COLOR_OPTIONS.map((o) => o.value),
  facialHairType: ["Blank", "Blank", "Blank", ...FACIAL_HAIR_OPTIONS.slice(1).map((o) => o.value)],
  facialHairColor: FACIAL_HAIR_COLOR_OPTIONS.map((o) => o.value),
  clotheType: CLOTHE_OPTIONS.map((o) => o.value),
  clotheColor: FABRIC_OPTIONS.map((o) => o.value),
  graphicType: GRAPHIC_OPTIONS.map((o) => o.value),
  eyeType: ["Default", "Happy", "Wink", "Side", "Squint", "Surprised"],
  eyebrowType: [
    "Default",
    "DefaultNatural",
    "RaisedExcitedNatural",
    "FlatNatural",
    "UpDownNatural",
  ],
  mouthType: ["Smile", "Default", "Twinkle", "Serious", "Tongue"],
  skinColor: SKIN_OPTIONS.map((o) => o.value),
};

/** Label lookup across every editor list, for a saved value shown in a section header. */
export function labelFor(key: AvatarKey, value: string | undefined): string {
  if (!value) return "";
  const lists: Partial<Record<AvatarKey, AvatarOption[]>> = {
    topType: HAIR_GROUPS.flatMap((g) => g.options),
    accessoriesType: ACCESSORY_OPTIONS,
    hatColor: FABRIC_OPTIONS,
    hairColor: HAIR_COLOR_OPTIONS,
    facialHairType: FACIAL_HAIR_OPTIONS,
    facialHairColor: HAIR_COLOR_OPTIONS,
    clotheType: CLOTHE_OPTIONS,
    clotheColor: FABRIC_OPTIONS,
    graphicType: GRAPHIC_OPTIONS,
    eyeType: EYE_OPTIONS,
    eyebrowType: EYEBROW_OPTIONS,
    mouthType: MOUTH_OPTIONS,
    skinColor: SKIN_OPTIONS,
  };
  const found = lists[key]?.find((o) => o.value === value);
  return found ? found.label : value.replace(/([a-z])([A-Z0-9])/g, "$1 $2");
}
