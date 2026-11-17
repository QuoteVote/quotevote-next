import { voteTag } from "@/lib/utils/voteTag";

describe("voteTag", () => {
  it("reads the response from a string, a comma-joined string or an array", () => {
    expect(voteTag("#true")).toBe("#true");
    expect(voteTag("topic, #like")).toBe("#like");
    expect(voteTag([" #Disagree "])).toBe("#disagree");
  });

  it("returns null when there is no known response", () => {
    expect(voteTag(null)).toBeNull();
    expect(voteTag("")).toBeNull();
    expect(voteTag("#maybe")).toBeNull();
    expect(voteTag(42)).toBeNull();
  });
});
