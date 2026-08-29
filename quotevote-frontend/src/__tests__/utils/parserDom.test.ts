import {
  parseDomSelection,
  isValidRangeForRoot,
  domApproximateStartOffset,
} from "@/lib/utils/parserDom";

// JSDOM's Range may not have getBoundingClientRect in some versions — polyfill
if (typeof Range !== "undefined" && !Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = function () {
    return {
      width: 100,
      height: 20,
      top: 0,
      left: 0,
      right: 100,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON() {},
    } as DOMRect;
  };
}

function makeRoot(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function stubRangeRect(range: Range, rect: Partial<DOMRect> = {}) {
  const fake = {
    width: 100,
    height: 20,
    top: 10,
    left: 10,
    right: 110,
    bottom: 30,
    x: 10,
    y: 10,
    toJSON() {},
    ...rect,
  } as DOMRect;
  // Range instances have own getBoundingClientRect in JSDOM — stub directly
  (range as unknown as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect = () => fake;
  return range;
}

describe("parserDom — isValidRangeForRoot", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  it("rejects collapsed ranges", () => {
    const root = makeRoot("<p>hello world</p>");
    const p = root.querySelector("p")!;
    const range = document.createRange();
    range.selectNodeContents(p);
    range.collapse(true);
    expect(isValidRangeForRoot(range, root)).toBe(false);
  });

  it("rejects ranges outside the root", () => {
    const root = makeRoot("<p>inside</p>");
    const outside = document.createElement("p");
    outside.textContent = "outside";
    document.body.appendChild(outside);
    const range = document.createRange();
    range.selectNodeContents(outside);
    stubRangeRect(range);
    expect(isValidRangeForRoot(range, root)).toBe(false);
  });

  it("rejects zero-geometry ranges", () => {
    const root = makeRoot("<p>hello</p>");
    const p = root.querySelector("p")!;
    const range = document.createRange();
    range.selectNodeContents(p);
    stubRangeRect(range, { width: 0, height: 0 });
    expect(isValidRangeForRoot(range, root)).toBe(false);
  });
});

describe("parserDom — parseDomSelection", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  function selectSubstring(root: HTMLElement, content: string, needle: string, occurrence: number) {
    // Find the occurrence index in original content, then create a range that
    // spans that occurrence inside the DOM. For simplicity we populate the root
    // with a text node equal to content and select within it.
    const p = document.createElement("p");
    p.textContent = content.replace(/\r\n/g, "\n");
    root.appendChild(p);
    const textNode = p.firstChild as Text;
    let idx = -1;
    let from = 0;
    for (let i = 0; i <= occurrence; i++) {
      idx = content.replace(/\r\n/g, "\n").indexOf(needle.replace(/\r\n/g, "\n"), from);
      if (idx === -1) throw new Error(`occurrence ${occurrence} not found`);
      from = idx + 1;
    }
    const range = document.createRange();
    range.setStart(textNode, idx);
    range.setEnd(textNode, idx + needle.replace(/\r\n/g, "\n").length);
    stubRangeRect(range);
    return range;
  }

  it("returns correct offsets for a unique passage", () => {
    const content = "hello world";
    const root = makeRoot("");
    const needle = "world";
    const range = selectSubstring(root, content, needle, 0);
    const res = parseDomSelection({ content, selectedText: needle, range, contentRoot: root });
    expect(res).toBeDefined();
    expect(res!.startIndex).toBe(6);
    expect(res!.endIndex).toBe(11);
    expect(res!.text).toBe("world");
  });

  it("picks the occurrence nearest the DOM offset for repeated text", () => {
    const content = "foo bar foo bar foo";
    const root = makeRoot("");
    // Select the second "foo" (index 8 in normalized content: "foo bar [foo] bar foo")
    const needle = "foo";
    const range = selectSubstring(root, content, needle, 1);
    const res = parseDomSelection({ content, selectedText: needle, range, contentRoot: root });
    expect(res).toBeDefined();
    // Second "foo" starts at 8
    expect(res!.startIndex).toBe(8);
    expect(res!.endIndex).toBe(11);
  });

  it("handles CRLF content without splitting a CRLF pair", () => {
    const content = "line1\r\nline2\r\nline3";
    const normalizedNeedle = "line2";
    const root = makeRoot("");
    const range = selectSubstring(root, content, normalizedNeedle, 0);
    // DOM text normalizes CRLF to LF, so selectedText arrives as "line2"
    const res = parseDomSelection({
      content,
      selectedText: "line2",
      range,
      contentRoot: root,
    });
    expect(res).toBeDefined();
    // "line1\r\n" is 7 chars original, line2 starts at 7
    expect(res!.startIndex).toBe(7);
    expect(res!.endIndex).toBe(12);
    expect(res!.text).toBe("line2");
  });

  it("handles selection spanning a CRLF boundary", () => {
    const content = "a\r\nb\r\nc";
    const root = makeRoot("");
    // Select "b\nc" in normalized space -> original "b\r\nc"
    const range = selectSubstring(root, content, "b\nc", 0);
    const res = parseDomSelection({
      content,
      selectedText: "b\nc",
      range,
      contentRoot: root,
    });
    expect(res).toBeDefined();
    expect(res!.startIndex).toBe(3);
    expect(res!.endIndex).toBe(7);
    expect(res!.text).toBe("b\r\nc");
  });

  it("returns undefined for text not in content", () => {
    const content = "hello world";
    const root = makeRoot("");
    const p = document.createElement("p");
    p.textContent = "hello world";
    root.appendChild(p);
    const range = document.createRange();
    range.selectNodeContents(p);
    stubRangeRect(range);
    const res = parseDomSelection({
      content,
      selectedText: "notfound",
      range,
      contentRoot: root,
    });
    expect(res).toBeUndefined();
  });

  it("returns undefined for empty selectedText", () => {
    const content = "hello";
    const root = makeRoot("<p>hello</p>");
    const p = root.querySelector("p")!;
    const range = document.createRange();
    range.selectNodeContents(p);
    stubRangeRect(range);
    expect(
      parseDomSelection({ content, selectedText: "", range, contentRoot: root })
    ).toBeUndefined();
  });

  it("returns undefined for collapsed range", () => {
    const content = "hello world";
    const root = makeRoot("<p>hello world</p>");
    const p = root.querySelector("p")!;
    const range = document.createRange();
    range.setStart(p.firstChild!, 2);
    range.collapse(true);
    expect(
      parseDomSelection({ content, selectedText: "hello", range, contentRoot: root })
    ).toBeUndefined();
  });

  it("derives correct offset when DOM approximate matches the second occurrence", () => {
    // Content has "abc abc abc", selection is "abc" at DOM position of third occurrence
    const content = "abc abc abc";
    const root = makeRoot("");
    const range = selectSubstring(root, content, "abc", 2);
    const res = parseDomSelection({ content, selectedText: "abc", range, contentRoot: root });
    expect(res!.startIndex).toBe(8);
  });

  it("CRLF: preceding CRLFs do not shift the approximate offset (P2 #2)", () => {
    // "x" + 5×CRLF + "foo foo" — first foo normalized at 6, original at 11
    const content = "x\r\n\r\n\r\n\r\n\r\nfoo foo";
    const root = makeRoot("");
    const range = selectSubstring(root, content, "foo", 0);
    const res = parseDomSelection({ content, selectedText: "foo", range, contentRoot: root });
    expect(res).toBeDefined();
    expect(res!.startIndex).toBe(11);
    expect(res!.endIndex).toBe(14);
    expect(res!.text).toBe("foo");
  });

  it("returns undefined when approx is null and multiple occurrences exist", () => {
    const content = "foo foo foo";
    const root = makeRoot("");
    const p = document.createElement("p");
    p.textContent = "foo";
    root.appendChild(p);
    const range = document.createRange();
    range.selectNodeContents(p);
    stubRangeRect(range);
    jest.spyOn(document, "createRange").mockImplementation(() => {
      throw new Error("forced");
    });
    const res = parseDomSelection({ content, selectedText: "foo", range, contentRoot: root });
    expect(res).toBeUndefined();
    jest.restoreAllMocks();
  });

  it("returns single occurrence even when approx is null", () => {
    const content = "unique foo end";
    const root = makeRoot("");
    const p = document.createElement("p");
    p.textContent = "foo";
    root.appendChild(p);
    const range = document.createRange();
    range.selectNodeContents(p);
    stubRangeRect(range);
    jest.spyOn(document, "createRange").mockImplementation(() => {
      throw new Error("forced");
    });
    const res = parseDomSelection({ content, selectedText: "foo", range, contentRoot: root });
    expect(res).toBeDefined();
    expect(res!.startIndex).toBe(7);
    jest.restoreAllMocks();
  });
});

describe("parserDom — domApproximateStartOffset", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns prefix text length", () => {
    const root = makeRoot("<p>hello </p><p>world</p>");
    const secondP = root.querySelectorAll("p")[1];
    const textNode = secondP.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);
    expect(domApproximateStartOffset(range, root)).toBe("hello ".length);
  });

  it("returns null when Range API throws", () => {
    const root = makeRoot("<p>hi</p>");
    // Force prefix creation to throw
    const originalCreateRange = document.createRange.bind(document);
    jest.spyOn(document, "createRange").mockImplementation(() => {
      throw new Error("forced");
    });
    // domApproximateStartOffset should catch and return null
    const dummyRange = originalCreateRange();
    dummyRange.selectNodeContents(root.querySelector("p")!);
    expect(domApproximateStartOffset(dummyRange, root)).toBeNull();
    jest.restoreAllMocks();
  });
});
