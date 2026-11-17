import { createAvatar, type StyleOptions } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";
import { FABRIC_OPTIONS, HAIR_COLOR_OPTIONS, SKIN_OPTIONS } from "@/lib/avatarOptions";
import type { AvatarDraft, AvatarStyle } from "@/types/avatar";

/**
 * First-party Avataaars rendering (#722). The stored avatar keeps the 13 Avataaars
 * qualities the editor saves; this maps them onto DiceBear's port of the same
 * Avataaars art and returns the SVG, so no browser ever loads avataaars.io.
 */

type AvataaarsOptions = StyleOptions<avataaars.Options>;
type Pick1<K extends keyof avataaars.Options> = avataaars.Options[K];

/** The Avataaars circle's background, as avataaars.io drew it. */
const CIRCLE_BACKGROUND = "65c9ff";
/** Avataaars glasses have fixed frame colours: Kurt and Prescription01 are white. */
const LIGHT_FRAMES = new Set(["Kurt", "Prescription01"]);
const DARK = "262e33";
/** Blazers ignore the outfit colour in Avataaars and are always this slate. */
const BLAZER = "3c4f5c";
const BLAZERS = new Set(["BlazerShirt", "BlazerSweater"]);
/**
 * DiceBear draws the natural unibrow in light grey; Avataaars draws every eyebrow dark.
 * The exact opening tag of that one shape, swapped for the dark fill the other eyebrows use.
 */
const UNIBROW_LIGHT = '<g fill-rule="evenodd" clip-rule="evenodd" fill="#DADADA">';
const UNIBROW_DARK = '<g fill-rule="evenodd" clip-rule="evenodd" fill="#000" fill-opacity=".6">';

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

/** Avataaars names DiceBear spells differently; the rest only lose their capital. */
const TOP: Record<string, string> = {
  WinterHat2: "winterHat02",
  WinterHat3: "winterHat03",
  WinterHat4: "winterHat04",
  LongHairBigHair: "bigHair",
  LongHairNotTooLong: "longButNotTooLong",
  LongHairStraight: "straight01",
  LongHairStraight2: "straight02",
  LongHairStraightStrand: "straightAndStrand",
  ShortHairTheCaesarSidePart: "theCaesarAndSidePart",
};
const CLOTHING: Record<string, string> = {
  BlazerShirt: "blazerAndShirt",
  BlazerSweater: "blazerAndSweater",
  CollarSweater: "collarAndSweater",
};
const EYES: Record<string, string> = { Close: "closed", Dizzy: "xDizzy" };
/** DiceBear has no Selena graphic; a stored one shows the other lettering graphic. */
const GRAPHIC: Record<string, string> = { Selena: "hola" };

function hex(options: { value: string; hex: string }[], value: string): string {
  const found = options.find((option) => option.value === value) ?? options[0];
  return found.hex.replace("#", "").toLowerCase();
}

function topName(topType: string): string {
  if (TOP[topType]) return TOP[topType];
  return lowerFirst(topType.replace(/^(LongHair|ShortHair)/, ""));
}

/** DiceBear options for a complete Avataaars draft, with every random choice pinned. */
export function toDiceBearOptions(draft: AvatarDraft, style: AvatarStyle): AvataaarsOptions {
  const bald = draft.topType === "NoHair" || draft.topType === "Eyepatch";
  const eyepatch = draft.topType === "Eyepatch";
  const glasses = draft.accessoriesType !== "Blank";
  const beard = draft.facialHairType !== "Blank";

  return {
    style: [style === "Circle" ? "circle" : "default"] as Pick1<"style">,
    backgroundColor: style === "Circle" ? [CIRCLE_BACKGROUND] : [],
    top: (bald ? [] : [topName(draft.topType)]) as Pick1<"top">,
    topProbability: bald ? 0 : 100,
    hairColor: [hex(HAIR_COLOR_OPTIONS, draft.hairColor)],
    hatColor: [hex(FABRIC_OPTIONS, draft.hatColor)],
    accessories: (eyepatch
      ? ["eyepatch"]
      : glasses
        ? [lowerFirst(draft.accessoriesType)]
        : []) as Pick1<"accessories">,
    accessoriesProbability: eyepatch || glasses ? 100 : 0,
    accessoriesColor: [LIGHT_FRAMES.has(draft.accessoriesType) ? "ffffff" : DARK],
    facialHair: (beard ? [lowerFirst(draft.facialHairType)] : []) as Pick1<"facialHair">,
    facialHairProbability: beard ? 100 : 0,
    facialHairColor: [hex(HAIR_COLOR_OPTIONS, draft.facialHairColor)],
    clothing: [CLOTHING[draft.clotheType] ?? lowerFirst(draft.clotheType)] as Pick1<"clothing">,
    clothesColor: [BLAZERS.has(draft.clotheType) ? BLAZER : hex(FABRIC_OPTIONS, draft.clotheColor)],
    clothingGraphic: [
      GRAPHIC[draft.graphicType] ?? lowerFirst(draft.graphicType),
    ] as Pick1<"clothingGraphic">,
    eyes: [EYES[draft.eyeType] ?? lowerFirst(draft.eyeType)] as Pick1<"eyes">,
    eyebrows: [lowerFirst(draft.eyebrowType)] as Pick1<"eyebrows">,
    mouth: [lowerFirst(draft.mouthType)] as Pick1<"mouth">,
    skinColor: [hex(SKIN_OPTIONS, draft.skinColor)],
  };
}

/** The avatar as an SVG document. */
export function renderAvatarSvg(draft: AvatarDraft, style: AvatarStyle = "Circle"): string {
  const svg = createAvatar(avataaars, toDiceBearOptions(draft, style)).toString();
  return draft.eyebrowType === "UnibrowNatural" ? svg.replace(UNIBROW_LIGHT, UNIBROW_DARK) : svg;
}
