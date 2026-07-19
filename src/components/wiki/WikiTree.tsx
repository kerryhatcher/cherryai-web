import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { ChevronDown, ChevronRight, FileText, Pencil, Search } from "lucide-react";
import { renameWikiFolder } from "@/api/wiki";
import { ApiError } from "@/api/errors";
import { ancestorsOf, buildTree, type TreeFolder, type TreeNode } from "@/lib/wikiTree";
import { cn } from "@/lib/utils";
import type { WikiListItem } from "@/types";

const EXPANDED_KEY = "cherryai.wiki.expanded";

function readExpanded(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(EXPANDED_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeExpanded(paths: string[]): void {
  try {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(paths));
  } catch {
    // Private mode or quota exceeded — expansion simply won't persist.
  }
}

/** Keep pages whose title matches, and folders that match or contain a match. */
function filterTree(nodes: TreeNode[], needle: string): TreeNode[] {
  const out: TreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "page") {
      if (node.title.toLowerCase().includes(needle)) out.push(node);
      continue;
    }
    const children = filterTree(node.children, needle);
    if (children.length > 0 || node.name.toLowerCase().includes(needle)) {
      out.push({ ...node, children });
    }
  }
  return out;
}

interface WikiTreeProps {
  entries: WikiListItem[];
  /** Slug of the page currently being viewed or edited, if any. */
  activeSlug?: string;
  isOnline: boolean;
  /** Called after a successful rename so the caller can refetch the list. */
  onRenamed: () => void;
}

export function WikiTree({ entries, activeSlug, isOnline, onRenamed }: WikiTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(readExpanded()));
  const [filter, setFilter] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const tree = useMemo(() => buildTree(entries), [entries]);
  const needle = filter.trim().toLowerCase();
  const visible = useMemo(() => (needle ? filterTree(tree, needle) : tree), [tree, needle]);

  // Open the ancestors of the active page so deep links reveal themselves.
  const activeFolder = entries.find((entry) => entry.slug === activeSlug)?.folder;
  useEffect(() => {
    if (!activeFolder) return;
    setExpanded((current) => {
      const next = new Set(current);
      for (const path of ancestorsOf(activeFolder)) next.add(path);
      writeExpanded([...next]);
      return next;
    });
  }, [activeFolder]);

  const toggle = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      writeExpanded([...next]);
      return next;
    });
  };

  const commitRename = async (folder: TreeFolder, nextName: string) => {
    const trimmed = nextName.trim();
    setRenaming(null);
    if (!trimmed || trimmed === folder.name) return;
    // Same rule the server's slugify applies per segment: a name with no
    // alphanumeric character slugifies to "" and gets silently dropped,
    // which would merge this folder into its parent instead of renaming it.
    if (!/[a-z0-9]/i.test(trimmed)) {
      setRenameError(`"${trimmed}" isn't a valid folder name — it needs at least one letter or number.`);
      return;
    }
    // Keeps the parent prefix ("research/") so only this segment is renamed.
    const parent = folder.path.slice(0, folder.path.length - folder.name.length);
    try {
      setRenameError(null);
      await renameWikiFolder(folder.path, `${parent}${trimmed}`);
      onRenamed();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // The folder vanished under us — our tree is stale, so refetch.
        setRenameError("That folder no longer exists — refreshing.");
        onRenamed();
      } else if (err instanceof ApiError && err.status === 400) {
        setRenameError(err.detail ?? `"${trimmed}" isn't a valid folder name here.`);
      } else {
        setRenameError(`Couldn't rename "${folder.name}".`);
      }
    }
  };

  const renderNodes = (nodes: TreeNode[], depth: number) =>
    nodes.map((node) =>
      node.kind === "page" ? (
        <Link
          key={node.slug}
          to={`/wiki/${node.slug}`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          className={cn(
            "flex items-center gap-1.5 truncate rounded-lg py-1.5 pr-2 text-sm transition-colors",
            node.slug === activeSlug
              ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
          )}
        >
          <FileText className="size-3.5 shrink-0 opacity-60" />
          <span className="truncate">{node.title}</span>
        </Link>
      ) : (
        <FolderNode
          key={node.path}
          folder={node}
          depth={depth}
          open={needle.length > 0 || expanded.has(node.path)}
          isOnline={isOnline}
          renaming={renaming}
          onToggle={toggle}
          onStartRename={setRenaming}
          onCommitRename={commitRename}
          renderNodes={renderNodes}
        />
      ),
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pb-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter pages…"
          aria-label="Filter wiki pages"
          className="w-full rounded-lg border border-input bg-sidebar-accent/30 py-1.5 pl-8 pr-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50"
        />
      </div>

      {renameError && <p className="px-1 text-xs text-destructive">{renameError}</p>}

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            {needle ? "No pages match." : "No wiki pages yet"}
          </p>
        ) : (
          renderNodes(visible, 0)
        )}
      </nav>
    </div>
  );
}

interface FolderNodeProps {
  folder: TreeFolder;
  depth: number;
  open: boolean;
  isOnline: boolean;
  renaming: string | null;
  onToggle: (path: string) => void;
  onStartRename: (path: string | null) => void;
  onCommitRename: (folder: TreeFolder, nextName: string) => void;
  renderNodes: (nodes: TreeNode[], depth: number) => ReactNode;
}

function FolderNode({
  folder,
  depth,
  open,
  isOnline,
  renaming,
  onToggle,
  onStartRename,
  onCommitRename,
  renderNodes,
}: FolderNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isRenaming = renaming === folder.path;

  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  return (
    <div>
      <div
        style={{ paddingLeft: `${depth * 12}px` }}
        className="group flex items-center gap-1 rounded-lg pr-1 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent/50"
      >
        <button
          type="button"
          onClick={() => onToggle(folder.path)}
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${folder.name}`}
          className="flex min-w-0 flex-1 items-center gap-1 py-1.5 pl-1.5 text-left"
        >
          {open ? (
            <ChevronDown className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 opacity-70" />
          )}
          {isRenaming ? (
            <input
              ref={inputRef}
              defaultValue={folder.name}
              onClick={(event) => event.stopPropagation()}
              onBlur={(event) => onCommitRename(folder, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") onStartRename(null);
              }}
              className="w-full rounded border border-cherry/50 bg-background px-1 py-0.5 text-xs outline-none"
            />
          ) : (
            <span className="truncate font-medium">{folder.name}</span>
          )}
        </button>

        {isOnline && !isRenaming && (
          <button
            type="button"
            onClick={() => onStartRename(folder.path)}
            aria-label={`Rename folder ${folder.name}`}
            className="shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-sidebar-accent focus:opacity-100 group-hover:opacity-60"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>

      {open && <div>{renderNodes(folder.children, depth + 1)}</div>}
    </div>
  );
}
