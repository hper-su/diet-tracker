import { describe, expect, it } from "vitest";
import {
  normalizeClientName,
  resolveClientName,
  findMatchingClient,
} from "./client-name-match.mjs";

describe("normalizeClientName", () => {
  it("strips half-width and full-width spaces", () => {
    expect(normalizeClientName("望月 良枝")).toBe("望月良枝");
    expect(normalizeClientName("望月　良枝")).toBe("望月良枝");
    expect(normalizeClientName("望月良枝")).toBe("望月良枝");
  });
});

describe("resolveClientName", () => {
  it("maps a known kanji/notation variant to the canonical Firestore name", () => {
    expect(resolveClientName("宮本漢之")).toBe("宮本漠之");
    expect(resolveClientName("髙井由起")).toBe("高井由起");
    expect(resolveClientName("堀漱太")).toBe("堀瀬太");
    expect(resolveClientName("チョンヨンファ")).toBe("チョン・ヨンファ");
  });

  it("leaves an unknown name unchanged", () => {
    expect(resolveClientName("原田紗英")).toBe("原田紗英");
  });
});

describe("findMatchingClient", () => {
  const clients = [
    { id: "1", name: "望月 良枝" },
    { id: "2", name: "宮本漠之" },
    { id: "3", name: "チョン・ヨンファ" },
  ];

  it("finds a client ignoring whitespace differences", () => {
    expect(findMatchingClient(clients, "望月良枝")).toEqual({ id: "1", name: "望月 良枝" });
  });

  it("finds a client through a name-variant override", () => {
    expect(findMatchingClient(clients, "宮本漢之")).toEqual({ id: "2", name: "宮本漠之" });
    expect(findMatchingClient(clients, "チョンヨンファ")).toEqual({
      id: "3",
      name: "チョン・ヨンファ",
    });
  });

  it("returns null when there is no match (new client)", () => {
    expect(findMatchingClient(clients, "原田紗英")).toBeNull();
  });

  it("returns null when more than one client matches", () => {
    const dupes = [...clients, { id: "4", name: "望月良枝" }];
    expect(findMatchingClient(dupes, "望月良枝")).toBeNull();
  });
});
