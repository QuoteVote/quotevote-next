/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";

const css = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

const baseBodyRules = (): string[] =>
  [...css.matchAll(/@layer base\s*{([\s\S]*?)\n}/g)].flatMap(([, layer]) =>
    [...layer.matchAll(/(?:^|\n)\s*body\s*{([^}]*)}/g)].map(([, rule]) => rule)
  );

describe("Long word wrapping", () => {
  it("lets long unbroken words and links wrap everywhere, so they stay inside their card", () => {
    const rules = baseBodyRules();

    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((rule) => /overflow-wrap:\s*break-word\s*;/.test(rule))).toBe(true);
  });

  it("isn't turned back off for any element", () => {
    expect(css).not.toMatch(/overflow-wrap:\s*normal/);
    expect(css).not.toMatch(/word-break:\s*keep-all/);
  });
});
