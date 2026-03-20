# Client-Only Vite + Router Rebuild

## Purpose / Big Picture

Rebuild `/home/renn/projects/aus-food-label/aus-food-label` from a TanStack Start application with auth, server functions, and a database-backed workspace into a client-only single-page application built on Vite and TanStack Router. After this change, a user can open the app, load the base ingredient catalogue from the two CSV files in `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-solid.csv` and `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-liquid.csv`, add their own ingredients, create recipes, persist both to browser local storage, and generate nutrition labels without any server or database dependency. The label area must include a clear disclaimer that the output is not guaranteed and is used at the user's own risk.

## Progress

- [x] (2026-03-20 10:06Z) Create and commit the migration plan on a dedicated branch.
- [ ] Replace the TanStack Start entry, route generation, and SSR shell with a plain Vite SPA entry and a single TanStack Router route.
- [ ] Implement client-side ingredient seed loading from the two CSV files and add validated local storage persistence for custom ingredients and recipes.
- [ ] Rebuild the UI into a one-page workflow that supports ingredient management, recipe creation, and nutrition label output with a disclaimer.
- [ ] Remove obsolete server/auth/database dependencies and files, validate with lint/type checks, and complete the plan.

## Surprises & Discoveries

- The repository does not contain `/home/renn/projects/aus-food-label/aus-food-label/docs/PLANS.md`, so the ExecPlan had to be authored without a local template.

## Decision Log

- 2026-03-20: Created the migration record on branch `client-only-vite-router` before implementation so the runtime rewrite can proceed in staged commits.

## Outcomes & Retrospective

- `(fill when complete)`

## Context and Orientation

The current app still assumes a server-backed TanStack Start runtime.

- `/home/renn/projects/aus-food-label/aus-food-label/package.json` includes `@tanstack/react-start`, `nitro`, `better-auth`, `drizzle-orm`, `@libsql/client`, and other server-only dependencies that will become obsolete after the migration.
- `/home/renn/projects/aus-food-label/aus-food-label/vite.config.ts` currently wires `tanstackStart()` and `nitro()` into Vite. A plain SPA should instead use the React plugin, Tailwind plugin, and only the router functionality required for a client render.
- `/home/renn/projects/aus-food-label/aus-food-label/src/router.tsx`, `/home/renn/projects/aus-food-label/aus-food-label/src/routes/__root.tsx`, and `/home/renn/projects/aus-food-label/aus-food-label/src/routeTree.gen.ts` are shaped around TanStack Start file routes and SSR document helpers. These will be replaced by a plain client router tree with one route for the single-page app.
- `/home/renn/projects/aus-food-label/aus-food-label/src/lib/ingredient/functions.ts` and `/home/renn/projects/aus-food-label/aus-food-label/src/lib/recipe/functions.ts` expose server functions that depend on auth and database access. Their responsibilities must move into client-side state and utility modules.
- `/home/renn/projects/aus-food-label/aus-food-label/src/lib/recipe/nutrition.ts` already performs the nutrition calculations on plain data objects. This file is the main reusable business-logic anchor and should remain intact or only be minimally adapted.
- `/home/renn/projects/aus-food-label/aus-food-label/scripts/import-ingredients.mjs` already contains CSV parsing and field mapping logic for the two seed files. The migration can reuse the parsing approach while reducing the output shape to only the fields needed by the client app.
- `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-solid.csv` and `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-liquid.csv` together contain about 2,083 data rows and around 1.07 MB of CSV text. Loading them in the browser is practical if the parser only retains the required nutrient fields.
- `/home/renn/projects/aus-food-label/aus-food-label/src/lib/ingredient/validation.ts` and `/home/renn/projects/aus-food-label/aus-food-label/src/lib/recipe/validation.ts` already define Zod validation rules that can be adapted for local forms and storage recovery.
- The repository does not contain `/home/renn/projects/aus-food-label/aus-food-label/docs/PLANS.md`, so this ExecPlan must be fully self-contained and cannot rely on a local template document.

Key terms used below:

- "Base ingredients" means the read-only catalogue derived from the two CSV files shipped with the app.
- "Custom ingredients" means user-created ingredients that are persisted in browser local storage.
- "Persisted recipes" means locally stored recipe records that reference ingredient ids and are hydrated through schema-validated parsing.
- "Malformed local storage" means any local storage value that is missing, invalid JSON, wrong version, wrong shape, or contains partially invalid entries.

## Plan of Work

### Milestone 1: Establish the migration record and safe branch state

Goal: create the dedicated migration branch and commit this plan before application changes begin.

Work:

- Create a new branch for the migration.
- Add this plan under `/home/renn/projects/aus-food-label/aus-food-label/docs/exec-plans/active/`.
- Commit the plan by itself so the implementation history is staged and recoverable.

Result:

- The branch contains a living plan that future sessions can resume from.

Proof:

- `git status --short --branch` shows the new branch.
- `git log --oneline -1` shows a plan-only commit.

### Milestone 2: Convert the runtime from TanStack Start to a plain Vite SPA

Goal: remove the SSR and server-entry assumptions so the app renders fully on the client with TanStack Router.

Work:

- Add a plain `index.html` and client entry file such as `/home/renn/projects/aus-food-label/aus-food-label/src/main.tsx`.
- Replace the current router implementation with a one-route or minimal-route client router.
- Remove Start-only concepts such as `HeadContent`, `Scripts`, `ScriptOnce`, `createServerFn`, auth route guards, generated file routes, and server route files.
- Adjust `/home/renn/projects/aus-food-label/aus-food-label/vite.config.ts` for a normal Vite React build.

Result:

- The app starts through Vite alone and no longer depends on Start, Nitro, or SSR helpers.

Proof:

- `pnpm lint` passes.
- `rg -n "@tanstack/react-start|createServerFn|HeadContent|Scripts|ScriptOnce|setupRouterSsrQueryIntegration" src vite.config.ts package.json` returns no relevant app usage.

### Milestone 3: Build the client data layer with safe local persistence

Goal: replace server/database persistence with robust, versioned, client-side state management.

Work:

- Define client data types for ingredients, recipes, recipe items, and local storage payloads.
- Reuse and adapt the existing Zod validation logic to validate form inputs and sanitize persisted state.
- Implement a local storage access layer that:
  - falls back safely when JSON parsing fails,
  - filters out invalid entries instead of crashing the app,
  - rewrites normalized data back to storage after recovery,
  - maintains stable ids for user-created ingredients and recipes.
- Use Jotai atoms to manage base ingredient load state, custom ingredients, recipes, and derived views.
- Add CSV parsing utilities that read `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-solid.csv` and `/home/renn/projects/aus-food-label/aus-food-label/public/ingredient-liquid.csv` in the client and map only the nutrient fields required for the label workflow.

Result:

- The data model is entirely local, recoverable, and independent of server functions.

Proof:

- `pnpm lint` passes.
- Searching for imports from `/home/renn/projects/aus-food-label/aus-food-label/src/lib/db/` and `/home/renn/projects/aus-food-label/aus-food-label/src/lib/auth/` in active app code returns no results.

### Milestone 4: Rebuild the UI as one page with ingredient, recipe, and label sections

Goal: deliver a single-route workflow that keeps all core tasks on one page and matches the new client-only data model.

Work:

- Replace the auth/dashboard split with a single-page workspace route.
- Design sections for:
  - base and custom ingredient catalogue,
  - custom ingredient creation,
  - recipe creation and saved recipe list,
  - nutrition label preview/output.
- Keep ingredient search/filter and recipe composition quality where useful, but remove flows that only existed for the authenticated shell.
- Add a clear disclaimer near the label creation/output action stating that the label is not guaranteed and is used at the user's own risk.
- Ensure all UI paths handle empty state, seed-loading state, and parse-recovery state gracefully.

Result:

- A user can manage ingredients, create recipes, and generate labels without navigating to separate pages.

Proof:

- `pnpm lint` passes.
- The root route renders the entire workflow from a single entry point.

### Milestone 5: Remove obsolete dependencies and finish cleanup

Goal: leave the repository aligned with the new architecture and free of server-only cruft.

Work:

- Remove obsolete source files, scripts, and dependencies tied to auth, database access, Start SSR, and query infrastructure that are no longer used.
- Update `package.json`, `pnpm-lock.yaml`, and any remaining config files.
- Re-run lint/type checks.
- Update this plan with timestamps, discoveries, and decisions.
- Commit cleanup separately from earlier implementation milestones when practical.

Result:

- The dependency graph and file tree match the client-only app.

Proof:

- `pnpm lint` passes.
- `pnpm install` or `pnpm remove` has updated `/home/renn/projects/aus-food-label/aus-food-label/pnpm-lock.yaml`.
- `rg -n "better-auth|drizzle|libsql|react-query|react-start|nitro" src package.json vite.config.ts` only returns intentionally retained references, if any.

## Concrete Steps

1. Confirm working tree and branch:
   - `git status --short --branch`
   - Expected: branch is `client-only-vite-router` and there are no unrelated uncommitted changes introduced by this migration start.
2. Commit the plan:
   - `git add docs/exec-plans/active/client-only-vite-router-rebuild.md`
   - `git commit -m "docs: add client-only rebuild plan"`
   - Expected: a single documentation commit exists before code changes.
3. Replace the runtime shell:
   - add `index.html`
   - add `/home/renn/projects/aus-food-label/aus-food-label/src/main.tsx`
   - update `/home/renn/projects/aus-food-label/aus-food-label/src/router.tsx`
   - update `/home/renn/projects/aus-food-label/aus-food-label/vite.config.ts`
4. Implement the client state and CSV loader:
   - add new client data modules under `/home/renn/projects/aus-food-label/aus-food-label/src/lib/`
   - remove or replace server-function modules under `/home/renn/projects/aus-food-label/aus-food-label/src/lib/ingredient/functions.ts` and `/home/renn/projects/aus-food-label/aus-food-label/src/lib/recipe/functions.ts`
5. Rebuild the single-page UI:
   - replace route components and obsolete auth shell components
   - wire forms to Jotai state and safe local storage persistence
6. Clean dependencies:
   - use `pnpm remove ...` for obsolete packages
   - if needed, use `pnpm add ...` for minimal client-only replacements
7. Validate:
   - `pnpm lint`
   - Expected: exits with status `0`.
8. Finalize the plan:
   - update completed progress items with UTC timestamps
   - move to completed when all work is done

## Validation and Acceptance

The migration is accepted when all of the following are true:

- `pnpm lint` exits successfully.
- The app contains a client entry file and no TanStack Start runtime usage.
- The only app route is the single-page client workspace or an equivalently minimal client router structure.
- Base ingredients come from the two CSV files and appear in the workspace after load.
- A user can create a custom ingredient, reload the page, and still see it.
- A user can create a recipe, reload the page, and still see it.
- The nutrition panel still derives values from the recipe ingredients and serving/product weights using the existing nutrition math.
- Invalid or malformed local storage does not crash the app; the code falls back to defaults or filtered valid records.
- The label area includes a clear user-beware disclaimer.
- `package.json` no longer contains server/auth/database dependencies that the rebuilt app does not use.

## Idempotence and Recovery

- If the runtime conversion fails mid-way, restore a known-good checkpoint with `git restore --source=HEAD --staged --worktree <path>` only for files created or modified by this migration session, then re-apply the milestone. Do not discard unrelated user work.
- If local storage schema work fails, keep the old persisted keys isolated behind versioned names so bad test data can be discarded without affecting the rest of the app.
- If CSV parsing proves too slow or too fragile in-browser, switch to a generated static JSON seed derived from the same two CSV files. The seed source of truth remains the CSV files.
- If dependency cleanup removes something still needed by a surviving UI component, reinstall only the minimal package and record the reason in the Decision Log before continuing.
