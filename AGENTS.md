# Agent Instructions — cherryai-web

This repository is an **independent git repository** with its own GitHub remote. The parent folder (`../`) contains only high-level planning and research; this repo holds the React SPA frontend implementation.

## Repository Structure

- **Parent folder** (`../`) — Planning repo (independent), holds project requirements and research. Never `git add` files from here into this repo's git history.
- **This folder** — Application code for the CherryAI React frontend. All implementation belongs here.
- Other independent repos at `../cherryai-api/` — FastAPI backend (separate repo, separate git history).

When working in this folder, all git operations (status, commit, push) apply to **this** repo only. Verify with `git rev-parse --show-toplevel` before committing.

## Git Workflow

- **Commit regularly.** Commit after each completed task, story, or phase of work. Do not let changes pile up into one large commit.
- **Use Conventional Commits** for every commit message:

  ```
  <type>[optional scope]: <description>
  ```

  Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`. Most commits will be `feat:` (new features), `fix:` (bug fixes), or `docs:` (documentation).

  - Description in present tense, imperative mood ("add", not "added"), under 72 characters.
  - Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer.

## Development Standards

### Python (tooling/scripts)

- **Never use pyenv.** Do not rely on pyenv shims or `.python-version` interpreters.
- **`python3` must only ever be invoked via `uv`** (`uv run python3 ...`); never call system `python`/`python3` directly.

### Code Quality

- **Always lint before committing.** Run `npm run lint` and fix issues automatically when possible.
- **Always build before committing.** Run `npm run build` to ensure TypeScript type-checking and Vite bundling succeed.
- **Don't break the PWA or offline behavior.** When modifying cache logic (`src/lib/offlineCache.ts`), UI state management, or SSE parsing, test that:
  - Offline mode still works (sessions/messages display cached data)
  - The app recovers when API comes back online
  - Streaming responses parse and display correctly

### TypeScript and Components

- Write all new code in TypeScript. Use strict type definitions.
- Follow established component patterns in `src/components/`.
- Use shadcn/ui components from `src/components/ui/` (customizable Radix UI + Tailwind).
- Keep components focused and reusable; extract helper functions to `src/lib/`.

### Styling

- Use **Tailwind CSS v4** utility classes in component `className` attributes.
- Avoid inline styles or separate CSS files unless absolutely necessary.
- Refer to `tailwind.config.ts` for color/spacing customization.
- Ensure responsive design works on mobile (especially iOS).

### Testing

While not enforced, consider adding tests for:
- API client error handling
- Offline cache read/write
- SSE token parsing
- Hook behavior (e.g., `useApiStatus`, `useSessions`)

Use a testing library like Vitest or Jest if adding tests.

## Subagents and Model Economy

When delegating work to subagents, always pick the cheapest model that can do the task well — cheaper models are usually faster as well as cheaper, so this saves both money and time:

- **Haiku** — mechanical, low-judgment work: writing docs from a known outline, renames and file moves, boilerplate, simple lookups and summaries.
- **Sonnet** — standard implementation against a clear spec or contract: UI components from an established design system, tests, routine refactors.
- **Opus (or stronger)** — only high-judgment work: architecture, visual design taste, debugging unknowns.

Match the model to the task, not the project's importance. Prefer running independent tasks as parallel subagents.

## Secrets and Environment

- **Never commit `.env` or `.env.local`** — these contain API URLs or sensitive configuration.
- Environment configuration is loaded via Vite's `import.meta.env.VITE_*` at build time.
- Document required env var names in README and setup instructions; never commit actual values.

## Commits and Collaboration

- Each commit should be a self-contained unit of work (one feature, one fix, one refactor).
- Use clear, descriptive commit messages so the git log reads like a history of decisions.
- If a commit breaks something, it's easier to revert a small commit than a large one.
- Push to the remote after each logical group of commits (e.g., after completing a feature).

## Related Documentation

- **[README.md](./README.md)** — Setup, build, configuration, PWA installation, code structure
- **[CherryAI Planning Repo README](../README.md)** — Project requirements and architecture decisions
- **[cherryai-api README](../cherryai-api/README.md)** — FastAPI backend that provides the API endpoints
- **[Demo Design Spec](../docs/superpowers/specs/2026-07-18-cherryai-demo-design.md)** — Technical design and implementation plan

## GitHub Actions

- **Always pin actions to full commit SHAs, never git tags** (tags are mutable and can be repointed at malicious code; SHAs are immutable). Keep the human-readable version in a trailing comment:

  ```yaml
  - uses: actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd # v5
  ```

  To resolve a tag to its SHA: `gh api repos/<owner>/<repo>/git/ref/tags/<tag> --jq '.object.sha'` (if `.object.type` is `tag` rather than `commit`, dereference the annotated tag object first).
