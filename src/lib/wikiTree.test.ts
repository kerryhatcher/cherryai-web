import { describe, expect, it } from "vitest";
import { ancestorsOf, buildTree, folderPaths } from "@/lib/wikiTree";
import type { WikiListItem } from "@/types";

const entry = (slug: string, title: string, folder: string): WikiListItem => ({
  id: slug,
  slug,
  title,
  tags: [],
  folder,
  updated_at: "2026-07-18T00:00:00Z",
});

describe("buildTree", () => {
  it("nests pages under their folder path", () => {
    const tree = buildTree([entry("ocr", "OCR Survey", "research/ocr")]);

    expect(tree).toHaveLength(1);
    const research = tree[0];
    expect(research).toMatchObject({ kind: "folder", name: "research", path: "research" });

    const ocr = research.kind === "folder" ? research.children[0] : null;
    expect(ocr).toMatchObject({ kind: "folder", name: "ocr", path: "research/ocr" });
  });

  it("keeps root pages as top-level leaves", () => {
    const tree = buildTree([entry("notes", "Demo Notes", "")]);
    expect(tree).toEqual([{ kind: "page", slug: "notes", title: "Demo Notes", folder: "" }]);
  });

  it("sorts folders before pages, alphabetically within each group", () => {
    const tree = buildTree([
      entry("zebra", "Zebra", ""),
      entry("apple", "Apple", ""),
      entry("nested", "Nested", "ops"),
      entry("deep", "Deep", "admin"),
    ]);

    expect(tree.map((node) => (node.kind === "folder" ? node.name : node.title))).toEqual([
      "admin",
      "ops",
      "Apple",
      "Zebra",
    ]);
  });

  it("merges sibling pages that share a folder", () => {
    const tree = buildTree([
      entry("a", "A", "research/ocr"),
      entry("b", "B", "research/ocr"),
    ]);

    const research = tree[0];
    const ocr = research.kind === "folder" ? research.children[0] : null;
    expect(ocr?.kind === "folder" ? ocr.children : []).toHaveLength(2);
  });

  it("nests a full three-level path", () => {
    const tree = buildTree([entry("leaf", "Leaf", "a/b/c")]);
    const a = tree[0];
    const b = a.kind === "folder" ? a.children[0] : null;
    const c = b?.kind === "folder" ? b.children[0] : null;
    expect(c).toMatchObject({ kind: "folder", path: "a/b/c" });
  });
});

describe("ancestorsOf", () => {
  it("returns each prefix of the path", () => {
    expect(ancestorsOf("a/b/c")).toEqual(["a", "a/b", "a/b/c"]);
  });

  it("returns nothing for the root", () => {
    expect(ancestorsOf("")).toEqual([]);
  });
});

describe("folderPaths", () => {
  it("collects every folder and intermediate folder, sorted and deduped", () => {
    expect(
      folderPaths([
        entry("a", "A", "research/ocr"),
        entry("b", "B", "research/models"),
        entry("c", "C", ""),
      ]),
    ).toEqual(["research", "research/models", "research/ocr"]);
  });
});
