import type { WikiListItem } from "@/types";

export interface TreeFolder {
  kind: "folder";
  /** Last path segment, e.g. "ocr". */
  name: string;
  /** Full path from the root, e.g. "research/ocr". */
  path: string;
  children: TreeNode[];
}

export interface TreePage {
  kind: "page";
  slug: string;
  title: string;
  folder: string;
}

export type TreeNode = TreeFolder | TreePage;

/** Every prefix of a folder path, shallowest first. "" yields []. */
export function ancestorsOf(folder: string): string[] {
  if (!folder) return [];
  const segments = folder.split("/");
  return segments.map((_, index) => segments.slice(0, index + 1).join("/"));
}

/** Every folder path in use, including intermediates, sorted and deduped. */
export function folderPaths(entries: WikiListItem[]): string[] {
  const paths = new Set<string>();
  for (const entry of entries) {
    for (const path of ancestorsOf(entry.folder)) paths.add(path);
  }
  return [...paths].sort((a, b) => a.localeCompare(b));
}

function sortInPlace(folder: TreeFolder): void {
  folder.children.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    const left = a.kind === "folder" ? a.name : a.title;
    const right = b.kind === "folder" ? b.name : b.title;
    return left.localeCompare(right);
  });
  for (const child of folder.children) {
    if (child.kind === "folder") sortInPlace(child);
  }
}

/**
 * Group a flat entry list into a folder tree.
 *
 * Folders are implicit: one exists because a page names it. Folders sort
 * before pages at every level, alphabetically within each group, regardless
 * of the entry list's own (updated_at) ordering.
 */
export function buildTree(entries: WikiListItem[]): TreeNode[] {
  const root: TreeFolder = { kind: "folder", name: "", path: "", children: [] };

  const folderAt = (path: string): TreeFolder => {
    let node = root;
    if (!path) return node;
    let prefix = "";
    for (const segment of path.split("/")) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const existing = node.children.find(
        (child): child is TreeFolder => child.kind === "folder" && child.name === segment,
      );
      if (existing) {
        node = existing;
      } else {
        const created: TreeFolder = { kind: "folder", name: segment, path: prefix, children: [] };
        node.children.push(created);
        node = created;
      }
    }
    return node;
  };

  for (const entry of entries) {
    folderAt(entry.folder).children.push({
      kind: "page",
      slug: entry.slug,
      title: entry.title,
      folder: entry.folder,
    });
  }

  sortInPlace(root);
  return root.children;
}
