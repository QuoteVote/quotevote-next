/**
 * @jest-environment node
 */
import { schema } from "@dicebear/avataaars";
import { completeDraft } from "@/lib/avatar";
import { AVATAAARS_VALUES } from "@/lib/avatarOptions";
import { renderAvatarSvg, toDiceBearOptions } from "@/lib/avatarRender";
import type { AvatarDraft, AvatarKey } from "@/types/avatar";

type SchemaProps = Record<string, { items?: { enum?: string[] } }>;
const props = (schema as { properties: SchemaProps }).properties;
const allowed = (option: string): string[] => props[option]?.items?.enum ?? [];

const draft = (overrides: Partial<AvatarDraft> = {}): AvatarDraft =>
  completeDraft({ ...overrides }, "maya");

/** Which DiceBear option each stored quality ends up in. */
const OPTION_FOR: Partial<Record<AvatarKey, string>> = {
  topType: "top",
  accessoriesType: "accessories",
  facialHairType: "facialHair",
  clotheType: "clothing",
  graphicType: "clothingGraphic",
  eyeType: "eyes",
  eyebrowType: "eyebrows",
  mouthType: "mouth",
};

describe("toDiceBearOptions (#722)", () => {
  it("maps every stored Avataaars value onto a value DiceBear knows", () => {
    const unknown: string[] = [];
    for (const [key, option] of Object.entries(OPTION_FOR) as [AvatarKey, string][]) {
      for (const value of AVATAAARS_VALUES[key]) {
        const options = toDiceBearOptions(draft({ [key]: value }), "Circle") as Record<
          string,
          unknown
        >;
        for (const name of options[option] as string[]) {
          if (!allowed(option).includes(name)) unknown.push(`${key}=${value} -> ${name}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it("maps every colour to a hex DiceBear accepts", () => {
    for (const key of [
      "hairColor",
      "facialHairColor",
      "skinColor",
      "clotheColor",
      "hatColor",
    ] as const) {
      for (const value of AVATAAARS_VALUES[key]) {
        const options = toDiceBearOptions(draft({ [key]: value }), "Circle");
        const colors = [
          ...(options.hairColor ?? []),
          ...(options.facialHairColor ?? []),
          ...(options.skinColor ?? []),
          ...(options.clothesColor ?? []),
          ...(options.hatColor ?? []),
        ];
        colors.forEach((hex) => expect(hex).toMatch(/^[0-9a-f]{6}$/));
      }
    }
  });

  it("pins every random choice, so the same draft always draws the same avatar", () => {
    const options = toDiceBearOptions(
      draft({ topType: "NoHair", accessoriesType: "Blank", facialHairType: "Blank" }),
      "Circle"
    );
    expect(options).toMatchObject({
      top: [],
      topProbability: 0,
      accessories: [],
      accessoriesProbability: 0,
      facialHair: [],
      facialHairProbability: 0,
    });
    const d = draft({ topType: "LongHairBun", eyeType: "Wink" });
    expect(renderAvatarSvg(d)).toBe(renderAvatarSvg({ ...d }));
  });

  it("handles the names DiceBear spells differently", () => {
    const o = (overrides: Partial<AvatarDraft>) => toDiceBearOptions(draft(overrides), "Circle");
    expect(o({ topType: "LongHairStraight" }).top).toEqual(["straight01"]);
    expect(o({ topType: "WinterHat3" }).top).toEqual(["winterHat03"]);
    expect(o({ topType: "ShortHairShortFlat" }).top).toEqual(["shortFlat"]);
    expect(o({ eyeType: "Close" }).eyes).toEqual(["closed"]);
    expect(o({ eyeType: "Dizzy" }).eyes).toEqual(["xDizzy"]);
    expect(o({ clotheType: "CollarSweater" }).clothing).toEqual(["collarAndSweater"]);
    // DiceBear has no Selena graphic.
    expect(o({ graphicType: "Selena" }).clothingGraphic).toEqual(["hola"]);
  });

  it("draws the eyepatch as an accessory over no hair, as Avataaars does", () => {
    const options = toDiceBearOptions(
      draft({ topType: "Eyepatch", accessoriesType: "Round" }),
      "Circle"
    );
    expect(options).toMatchObject({
      topProbability: 0,
      accessories: ["eyepatch"],
      accessoriesProbability: 100,
    });
  });

  it("keeps the colours Avataaars fixes: glasses frames and blazers", () => {
    const o = (overrides: Partial<AvatarDraft>) => toDiceBearOptions(draft(overrides), "Circle");
    expect(o({ accessoriesType: "Kurt" }).accessoriesColor).toEqual(["ffffff"]);
    expect(o({ accessoriesType: "Round" }).accessoriesColor).toEqual(["262e33"]);
    expect(o({ clotheType: "BlazerShirt", clotheColor: "Red" }).clothesColor).toEqual(["3c4f5c"]);
    expect(o({ clotheType: "Hoodie", clotheColor: "Red" }).clothesColor).toEqual(["ff5c5c"]);
  });

  it("draws the circle on the Avataaars blue, and no background for the transparent style", () => {
    expect(toDiceBearOptions(draft(), "Circle")).toMatchObject({
      style: ["circle"],
      backgroundColor: ["65c9ff"],
    });
    expect(toDiceBearOptions(draft(), "Transparent")).toMatchObject({
      style: ["default"],
      backgroundColor: [],
    });
  });
});

describe("renderAvatarSvg (#722)", () => {
  it("returns a self-contained SVG that makes no request", () => {
    const svg = renderAvatarSvg(draft());
    expect(svg).toMatch(/^<svg/);
    // Only XML namespaces and the art's license credit name URLs; nothing is loaded.
    expect(svg).not.toMatch(/href=|<image|url\(\s*['"]?https?:|avataaars\.io/);
    expect(svg).toContain("<dc:creator>Pablo Stanley</dc:creator>");
  });

  it("draws the natural unibrow dark, like the other eyebrows", () => {
    const svg = renderAvatarSvg(draft({ eyebrowType: "UnibrowNatural" }));
    expect(svg).not.toContain('fill="#DADADA"');
    expect(svg).toContain('fill="#000" fill-opacity=".6"');
  });

  it("renders every stored value of every quality without throwing", () => {
    for (const key of Object.keys(AVATAAARS_VALUES) as AvatarKey[]) {
      for (const value of AVATAAARS_VALUES[key]) {
        expect(renderAvatarSvg(draft({ [key]: value }))).toMatch(/^<svg/);
      }
    }
  });
});
