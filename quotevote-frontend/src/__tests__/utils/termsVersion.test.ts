/**
 * @jest-environment node
 */
import { readFileSync } from "fs";
import path from "path";
import { CURRENT_TERMS_VERSION } from "@/lib/constants/terms";

describe("CURRENT_TERMS_VERSION", () => {
  it("matches the backend terms policy, which rejects any other version at signup", () => {
    const policy = readFileSync(
      path.resolve(__dirname, "../../../../quotevote-backend/app/data/utils/termsPolicy.ts"),
      "utf8"
    );
    const backendVersion = policy.match(/CURRENT_TERMS_VERSION = '([^']+)'/)?.[1];

    expect(backendVersion).toBeDefined();
    expect(CURRENT_TERMS_VERSION).toBe(backendVersion);
  });
});
