# CLAUDE.md

Multi-tenant CRM/ERP on TanStack Start + Cloudflare Workers + Neon Postgres +
Better Auth. **Read `specification.md` first**: architecture, data model,
permissions, conventions, known pitfalls and the pending-task list live there.

## Starting a session
- Use the `project-navigator` agent (or §14 of the spec) to see where things stand.
- Ask the owner which pending task (spec §12) to work on; don't start P3 ideas unprompted.

## Rules that must never be broken
- **Tenant isolation:** every query filters by `context.organizationId` from the session; validate referenced ids with `assertWorkspaceRefs`.
- **Every server function** has `requirePermission(...)` and a Zod `.validator(...)`.
- **No plain exported `db` helpers in modules routes import** — put them in `*.server.ts` (otherwise the DB client ships to the browser and crashes the page).
- Money in integer cents, tax in basis points, dates in UTC (all-day at 12:00 UTC).
- Never edit `.env*`; never print secret values.

## Definition of done
`bun run validate` passes (typecheck, Biome, build, browser-bundle check), plus a
browser check for UI changes (curl doesn't run JavaScript).

## Git workflow (owner's standing preference)
- Branch per change from `main`; never commit to `main`.
- Follow `agents/commit-and-push.md`: explicit staging, secret scan, Conventional
  Commit, **ask before committing and again before pushing**. `gh` is not
  installed: give the owner the PR link and a pasteable description.
- Ask before applying migrations (`migration-guard` agent).
- Update `specification.md` in the same PR (`spec-keeper` agent).

## Environment notes
- Windows 11, PowerShell + Git Bash, Bun 1.4. `bun run dev` = Vite on Node, port 3000.
- Line endings are LF (`.gitattributes`). The running dev server rewrites `src/routeTree.gen.ts`.
