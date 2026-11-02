# Specification — My TanStack App

> Living specification for this repository. It records what exists, why it is
> built the way it is, the rules every change must follow, and what is still
> pending. **Read it before changing anything; update it in the same PR as any
> change it describes** (see the `spec-keeper` agent).
>
> Last updated: 2026-11-02 · `main` at `bef6d45` (PR #13, skills and real email)

---

## 1. What this is

A multi-tenant business app (a small CRM/ERP) built on TanStack Start and
deployed to Cloudflare Workers, with data in Neon Postgres.

- **Tenants are workspaces.** Every user belongs to one or more workspaces with
  a role. All business data belongs to exactly one workspace.
- **Modules:** authentication & security · workspaces, members and roles ·
  customers · products · orders · invoices · tasks (kanban) · CRM activities ·
  calendar · KPI dashboard · projects (early example resource).
- **Repository:** `https://github.com/Fuema/bun_tanstack_neon_cloudflare`
- **Owner:** Fuema. Works on Windows 11 with VS Code, PowerShell and Bun.

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | TanStack Start 1.169 (React 19, Router 1.170) | File routes in `src/routes`, server functions via `createServerFn` |
| Runtime / host | Cloudflare Workers (`wrangler.jsonc`, `nodejs_compat`) | Dev server runs Vite **on Node** (see §10) |
| Package manager | Bun 1.4 | `bun.lock`; scripts run with `bun run …` |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP) | Drizzle ORM 0.45, migrations with drizzle-kit |
| Auth | Better Auth 1.7.14 (self-hosted) | Plugins: twoFactor, passkey, organization, haveIBeenPwned, tanstackStartCookies |
| UI | Tailwind CSS 4, shadcn/ui (new-york, zinc), lucide icons | `cn` helper from the npm `cn` package (tailwind-merge compatible) |
| Forms / data | TanStack Form 1.33, TanStack Query 5, TanStack Table **v9** | Zod 4 schemas passed directly to TanStack Form |
| Drag & drop | `@dnd-kit/core` 6.3 + `@dnd-kit/sortable` 10 | Task board |
| Email | Resend HTTP API (no SDK) | `src/lib/email.ts` |
| Lint / format | Biome 2.4.5 (tabs, double quotes) | Covers `src/` only |
| Types | TypeScript 6 | `bun run typecheck` must be 0 errors |

## 3. Running the project

```powershell
bun install
bun run dev                 # http://localhost:3000 (Vite on Node)
bun run validate            # typecheck + Biome + build + browser-bundle check
```

| Script | Purpose |
|---|---|
| `dev` | Dev server on port 3000. Emails print to this terminal while Resend isn't configured. |
| `typecheck` / `check` / `build` | TypeScript, Biome, production build |
| `check:bundle` | Build, then fail if server code or secret values reach the browser bundle |
| `validate` | **The definition of done**: all of the above |
| `db:generate` / `db:migrate` | Create / apply a Drizzle migration (`drizzle/`) |
| `db:seed:customers` | `--email <user> [--workspace "Name"] [--count N] [--clear]` |
| `db:seed:sales` | Products, orders, invoices: `--email <user> --workspace "Name" [--clear]` |
| `db:seed:planning` | Tasks and activities: `--email <user> --workspace "Name" [--clear]` |
| `email:test` | `bun run email:test you@example.com`: sends one real email through Resend |
| `deploy` | Build and `wrangler deploy` (not done yet, see §12) |

Seeded rows are tagged `[demo]` (in notes/description) so `--clear` removes only them.
Test accounts in the dev database: `jose@aaa.com`, `luis@aaa.com` (passwords are the owner's; never commit them).

### Environment variables (`.env.local`, never committed)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string (server only) |
| `BETTER_AUTH_SECRET` | yes | Session signing secret |
| `BETTER_AUTH_URL` | yes | Public base URL (`http://localhost:3000` in dev). Passkeys and OAuth callbacks depend on it |
| `RESEND_API_KEY`, `EMAIL_FROM` | for real email | Without them emails print to the console in dev and throw in production. Dev uses the test sender `EMAIL_FROM="My CRM <onboarding@resend.dev>"`, which only delivers to the Resend account owner; other recipients are rejected and fall back to the console. Free plan: 100 emails/day, 3,000/month |
| `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET` | optional | Social buttons appear only when both values of a provider are set |
| `VITE_SENTRY_*`, `SENTRY_AUTH_TOKEN` | optional | Present but Sentry is not wired up yet (§12) |

## 4. Architecture

```
src/
  routes/            file routes (TanStack Router)
    __root.tsx       document shell, theme init script in <head>
    _guest.tsx       guard: signed-in users are redirected to /dashboard
    _guest/…         login, signup, forgot/reset password, two-factor
    _authed.tsx      guard + app shell (sidebar, top bar, invitation banner)
    _authed/…        every protected page
    api/auth/$.ts    Better Auth HTTP handler
    verify-email.tsx email verification landing page
  lib/               server functions, shared rules and helpers
    *.server.ts      server-only helpers (never imported by routes/components)
  components/        UI by feature (Auth, Customers, Dashboard, Layout, Orders, Tasks, Workspace, data, ui)
  db/schema.ts       Drizzle schema (single file)
  db/index.ts        Neon HTTP client
scripts/             seed scripts, email test, bundle check
drizzle/             SQL migrations 0000-0005 (all applied to the dev database)
.claude/agents/      Claude Code subagents for this repo (§13)
.claude/skills/      general skills (commit-and-push, setup-*), master copy (§13)
AGENTS.md            TanStack Intent skill loading
```

### Request flow for a protected page
1. `_authed.tsx` `beforeLoad` calls `getSession()` (server function). No session → redirect to `/login?redirect=<path>`.
2. It then calls `getWorkspaceAccess()`, which returns the active workspace, the user's role there and a `can` map for the UI. Sessions without an active workspace get one (the user's last-used, else first, else a newly created personal workspace).
3. The page loader calls server functions such as `listCustomers`, each guarded by `requirePermission(...)`.

### Server functions: the pattern every module follows
```ts
export const deleteThing = createServerFn({ method: "POST" })
  .middleware([requirePermission({ thing: ["delete"] })]) // 401 / 403
  .validator(zodSchema)                                     // input validation
  .handler(async ({ data, context }) => {
    // every query filters by context.organizationId (the tenant)
  });
```
- Errors that the UI shows are thrown as `new Response(message, { status })` (400/404/409). In the browser they arrive as a thrown `Response`; `serverErrorMessage()` turns them into text.
- **Never export a plain function that uses `db` from a module a route or component imports.** Put it in `*.server.ts` (§10.1).

## 5. Data model (`src/db/schema.ts`)

All business tables carry `tenant_id` (or `organization_id`) → `organization.id ON DELETE CASCADE`.

| Table | Purpose | Key rules |
|---|---|---|
| `user`, `session`, `account`, `verification` | Better Auth core | `session.active_organization_id` = current workspace |
| `two_factor`, `passkey`, `rate_limit` | Auth plugins | Rate limits stored in Postgres (Workers don't share memory) |
| `organization`, `member`, `invitation` | Workspaces | Roles: owner, admin, editor, viewer |
| `project` | Early example resource | `organization_id` |
| `customer` | CRM customers | Email unique per tenant (case-insensitive); status lead/active/inactive; country ISO-2 |
| `product` | Catalog | SKU unique per tenant; price in cents; inactive = not orderable |
| `sales_order`, `order_line` | Orders | Number per tenant (`ORD-0001`); status draft → confirmed → fulfilled / cancelled; lines snapshot name/SKU/price |
| `invoice`, `invoice_line` | Invoices | One per order; numbered on issue (`INV-YYYY-0001`); draft → issued → paid, or void |
| `tenant_setting` | Billing defaults | Currency, default tax (basis points), payment terms (days) |
| `tenant_counter` | Document numbering | Atomic upsert `value + 1` per (tenant, kind, year) |
| `task` | Kanban tasks | Status backlog/todo/in_progress/review/done; fractional `position`; optional assignee, due date, customer, order |
| `activity` | CRM activities | call/meeting/email/follow_up; start/end; owner; customer/order links; done flag |

Conventions: ids are `text` UUIDs (`crypto.randomUUID()`); money is **integer cents**; tax is **basis points** (825 = 8.25 %, rounded once on the subtotal, half-up); timestamps are UTC. Deleting a customer with orders, a product used on orders, or an order with an invoice is refused with 409 (records are kept).

## 6. Authentication and security

- Email + password with **required email verification**; password policy (12-128 chars, upper, lower, digit, symbol, no name/email) enforced in the form **and** in a Better Auth `before` hook; breached-password check (Have I Been Pwned).
- Social sign-in (Google, GitHub): code ready, credentials not configured.
- **MFA:** authenticator app (TOTP), email code, backup codes, trusted devices, account lockout after 10 failures (15 min). **Passkeys** (WebAuthn) for sign-in.
- **Sessions:** 7-day rolling cookie, no cookie cache (revocation is immediate), "sign out other devices", all sessions revoked on password reset, fresh sign-in (15 min) needed for sensitive changes.
- **Rate limits** (Postgres): sign-in 5/min, sign-up 3/10 min, password reset 3/10 min, 2FA 5/min, invitations 10/10 min, workspace creation 5/10 min, default 100/min. Client IP from `cf-connecting-ip`.
- Redirect targets are restricted to same-site paths (`safeRedirect`).
- Theme preference and sidebar state are the only things stored in the browser.

## 7. Authorization (`src/lib/permissions.ts`)

One access-control definition shared by server and client. The server enforces it with `requirePermission`; the UI uses `roleCan(role, …)` only to hide controls.

| Resource | owner | admin | editor | viewer |
|---|---|---|---|---|
| organization (workspace) | update, delete | update | — | — |
| member / invitation | all | all | — | — |
| project, customer, product, order | CRUD | CRUD | create, read, update | read |
| invoice | all incl. issue, pay, void | all incl. issue, pay, void | create, read, update (drafts) | read |
| task, activity | CRUD | CRUD | create, read, update | read |

Adding a resource = one line in `statements` plus the four roles. Owner is only assigned to a workspace's creator; nobody changes their own role; only owners change owners.

## 8. Features (by route)

| Route | What it does |
|---|---|
| `/` | No page: redirects on the server to `/dashboard` when signed in, otherwise to `/login` |
| `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/two-factor`, `/verify-email` | Auth flows; theme switch and logo on the card |
| `/dashboard` | KPI tiles (customers, new customers vs previous 30 days, active rate, team), new customers per month, customers by status, top countries; every chart has a table view; palette validated for color-vision deficiency (tokens `--viz-*` in `styles.css`) |
| `/customers` | TanStack Table v9 in manual mode: search, status/country filters, sorting, pagination in Postgres; state in the URL; create/edit dialog |
| `/products` | Catalog list and dialog |
| `/orders`, `/orders/new`, `/orders/$id` | Order list; line editor with live totals; status actions; create invoice |
| `/invoices`, `/invoices/$id` | List with overdue filter; issue / mark paid / void / delete draft; printable document |
| `/tasks` | Kanban (dnd-kit): drag between and within columns (pointer, touch, keyboard), server-computed positions, filters in the URL |
| `/calendar` | Day / week / month views of tasks (by due date) and activities (by start); create/edit dialogs |
| `/projects` | Early example resource (simple CRUD) |
| `/workspace/members`, `/workspace/settings`, `/workspace/new`, `/accept-invitation/$id` | Members, roles, invitations, billing defaults, rename/leave/delete |
| `/account/security` | 2FA, passkeys, password, signed-in devices |

App shell: collapsible sidebar (Overview · Sales · Planning · Work · Workspace), workspace switcher, top bar with page title, light/dark/system theme (applied before first paint) and profile menu. Sidebar and top bar are hidden when printing.

## 9. Conventions (follow these in every change)

1. **Tenant isolation:** every query filters by the tenant from the session (`context.organizationId`), never from client input. Validate every referenced id (assignee, customer, order…) against the tenant (`assertWorkspaceRefs`).
2. **Permissions:** every server function has `requirePermission`; the UI hides what the role can't do but never relies on that.
3. **Validation:** shared Zod schemas in `src/lib/schema.ts`, used by forms and server validators. Server re-checks anything the client could fake (prices come from the catalog, never from the browser).
4. **Lists:** server-side search/filter/sort/pagination; state in the URL via `validateSearch` with `.catch()` defaults so hand-edited URLs fall back safely.
5. **Status machines** are enforced on the server with a guarded `UPDATE … WHERE status = <from>`.
6. **Money** in cents, **tax** in basis points, **dates** in UTC; all-day dates stored at 12:00 UTC (`src/lib/calendar.ts`).
7. **Atomicity:** neon-http has no interactive transactions; use `db.batch([...])` for multi-statement writes.
8. **Accessibility:** labels on every input, `aria-invalid`/`aria-describedby` on errors, keyboard support, no information by color alone, `sr-only` text instead of `aria-label` on non-interactive elements (Biome enforces much of this).
9. **Style:** Biome formatting (tabs, double quotes); comments explain *why*; components grouped by feature; shadcn components in `src/components/ui` (vendor code — keep edits minimal and commented).
10. **Seed data** is tagged `[demo]` and removable with `--clear`.

## 10. Known pitfalls (learned the hard way)

1. **Server code in the browser bundle.** TanStack Start strips only `createServerFn` handler bodies. A plain exported function using `db` in a module that a route imports ships the database client to the browser, which crashes the page ("DATABASE_URL is missing"). Keep such helpers in `*.server.ts`; `bun run check:bundle` guards this.
2. **`bun run dev` must run Vite on Node** (`vite dev`). `bun --bun vite dev` breaks the Cloudflare plugin's Miniflare on Windows (`ECONNREFUSED`).
3. **Line endings:** `.gitattributes` forces LF. If a pull is blocked by "local changes", check `git diff --ignore-cr-at-eol` before stashing.
4. **The running dev server rewrites `src/routeTree.gen.ts`** on branch switches; regenerate with `bun run generate-routes` and commit it with route changes.
5. **curl smoke tests don't run browser JavaScript.** Client-side crashes only show in the browser console; the bundle check plus a manual browser pass cover this.
6. **TanStack Table v9** is feature-based (`tableFeatures`, `useTable({ features })`); `row.getAllCells()` (not `getVisibleCells`) without the column-visibility feature. Server functions use `.validator()` (not `.inputValidator()`) in this Start version.
7. **shadcn CLI** asks to overwrite existing components; answer "no" (`yes n | bunx --bun shadcn@4.23.0 add …`).
8. **Bun on Windows ignores `TZ=…` on the command line**; set `process.env.TZ` inside a script before creating dates.

## 11. Workflow

- **Branch per change** (`feat/…`, `fix/…`, `docs/…`, `chore/…`) from `main`; never commit to `main`.
- Procedure: the personal `commit-and-push` skill plus the repo rules in `CLAUDE.md`: `bun run validate` → review → explicit staging (never `git add .`) → secret scan → Conventional Commit → **confirm before commit** → **confirm again before push** → PR description for the owner to paste (`gh` is not installed).
- Migrations: generate, review the SQL (additive vs destructive), **ask before `db:migrate`**, verify tables afterwards. Migrations run against the dev database in `.env.local`.
- After a PR is merged: switch to `main`, pull, delete the local branch; delete remote branches only when asked.
- Update this file in the same PR when behaviour, data model, conventions or pending tasks change.

## 12. Pending tasks

### P1 — needed before production
- [x] **Real email in dev:** `RESEND_API_KEY` and `EMAIL_FROM` (test sender `onboarding@resend.dev`) set in `.env.local`; `bun run email:test` delivered to the Resend account owner and the owner confirmed it on 2026-11-02.
- [ ] **Verify a sending domain in Resend** (DNS records), then switch `EMAIL_FROM` to an address on it so invitations and resets reach any recipient. Needed before production.
- [ ] **Deploy to Cloudflare:** set secrets with `wrangler secret put` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, OAuth), set `BETTER_AUTH_URL` to the real domain (passkeys depend on it), rename the worker (`wrangler.jsonc` name is still `tanstack-start-app`), decide which Neon branch production uses and apply migrations there, then test sign-in, passkeys and invitations live.
- [ ] **Automated tests:** there is no test runner yet. Money, calendar and permission checks were run as ad-hoc scripts; turn them into `bun test` suites, plus API tests for tenant isolation and status machines.
- [ ] **Verify rate limiting without a proxy IP header** (local dev has no `cf-connecting-ip`; confirm whether limits apply).
- [ ] **Exercise full 2FA sign-in end to end** (setup was checked; complete sign-in with TOTP/email/backup code wasn't).

### P2 — cleanup
- [ ] Remove unused legacy files: `src/db.ts`, `src/integrations/better-auth/header-user.tsx`, `db/init.sql` (old to-do schema).
- [ ] Rewrite `README.md` (still the TanStack starter text, e.g. `bun --bun run dev`) and complete `.env.example` (list every variable in §3).
- [ ] Sentry: `.cursorrules` asks to instrument server functions with `Sentry.startSpan`, but Sentry isn't initialised anywhere. Decide: wire it up or remove the rules and env vars.
- [ ] Decide the fate of `/projects` (early example) — keep as a real module or remove.
- [ ] Delete merged remote branches: `chore/dev-script-and-format`, `chore/line-endings`, `feat/customers`, `feat/orders-invoices`, `feat/tasks`; delete local `feat/orders-invoices`.
- [ ] Add a scheduled cleanup for expired `rate_limit` rows and old `verification` rows.

### P3 — product ideas (not started, confirm with the owner first)
- Customer detail page (orders, invoices, tasks, activities per customer).
- Dashboard revenue KPIs (orders/invoices per month, receivables, overdue amount).
- Invoice PDF file and "send invoice by email"; partial payments; credit notes.
- Task comments and notifications; activity reminders.
- Audit log; workspace teams; custom roles.
- Searchable combobox for customer/product pickers (current `Select` lists up to 1000 items).

### Known limitations (acceptable for now)
- Order/invoice numbers come from a counter incremented before the insert batch; a failed batch leaves a gap.
- `updateOrder` checks `status = draft` before its batch; the line replacement itself isn't status-guarded (tiny race window).
- Demo seeding uses fixed tags; re-running requires `--clear` first.

## 13. Agents

Claude Code subagents in `.claude/agents/` (use them; they encode this spec):

| Agent | Use it to |
|---|---|
| `project-navigator` | Resume after a break: read this spec and git state, report where things stand and the next steps |
| `validator` | Run the definition of done and report (read-only) |
| `resource-builder` | Add a new tenant-scoped resource following §4/§9 end to end |
| `migration-guard` | Generate, review and (with approval) apply a schema migration |
| `security-reviewer` | Review a diff for tenant isolation, permissions, validation and bundle leaks (read-only) |
| `spec-keeper` | Update this file after a change (data model, features, pending tasks, changelog) |

Subagents are for checks and reports; they run on their own and can't stop to ask the owner a question. Procedures that need the owner's input mid-way are **skills** in `.claude/skills/` (versioned in this private repo; run as `/<name>`):

| Skill | Use it to |
|---|---|
| `commit-and-push` | Branch, validate, stage, secret-scan, commit and push with two confirmations (repo additions in `CLAUDE.md`) |
| `setup-resend-email` | Add Resend email to any app: env vars, server-only module, dev fallback, test script, domain verification |
| `setup-neon-db` | Link an app to a Neon project and provision Postgres |
| `setup-neon-auth` | Add Neon Auth (Managed Better Auth); recommends self-managed Better Auth when MFA/passkeys are needed, as here |

These replaced the old `agents/` folder. `AGENTS.md` (TanStack Intent skills) moved to the repo root.

The skills are general (not tied to this app). This repo is their **master copy**; the owner also keeps them in `~/.claude/skills/` so other projects can use them. Edit them here and copy the folder there afterwards, so the two copies don't drift (both are visible in this project, with the same names). Only these four belong here: Claude Code's own `synced/` folder and installed skills such as `find-skills` (a link) stay in `~/.claude/skills/` only.

## 14. How to resume (checklist)

1. `git switch main && git pull` · `git status` (clean?) · `git log --oneline -10`.
2. Read §12; ask the owner which item is next.
3. `bun install` · `bun run validate` (must pass) · `bun run dev`.
4. Branch, build, validate, commit with the procedure, update this spec.

## 15. Changelog (merged PRs)

| PR | Change |
|---|---|
| #1–#2 | Branch-per-change commit procedure; Neon auth agent doc |
| #3–#4 | Better Auth on Neon via Drizzle; sign-in/sign-up/dashboard pages |
| #5 | MFA, passkeys, social sign-in, rate limits, guards |
| #6 | Workspaces with role-based permissions; projects example |
| #7 | LF line endings (`.gitattributes`) |
| #8 | `bun run dev` on Windows; Biome formatting; no known validation failures |
| #9 | Customer CRUD (server-side table); KPI dashboard |
| #10 | Email dev fallback; products, orders, invoices; sidebar shell and dark mode |
| #11 | Task board (dnd-kit) and activity calendar |
| #12 | Specification, CLAUDE.md, subagents, `bun run validate` / `check:bundle` |
| #13 | Real email via Resend confirmed in dev; domain verification left as a P1 task; `agents/` docs became personal skills (incl. new `setup-resend-email`), `AGENTS.md` moved to the root |
| (this PR) | `/` redirects to the dashboard or sign-in instead of the starter page; the four skills versioned in `.claude/skills/` |
