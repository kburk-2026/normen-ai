# Normen AI

Karen's portfolio project: an AI-in-the-workplace version of her Product Development
Space playbook (separate project, separate repos; never touch Product Development
Space from here). Repo: `kburk-2026/normen-ai` (public). Hosting: Vercel Hobby.
Supabase only in phase 3. Everything must stay on free tiers: no paid AI APIs.

"Normen" is German for "standards." Tagline: "Good AI has norms."

## Working rules

- Plan before coding; show Karen a visual mockup before any design change.
- Confirm before anything external or hard to undo: pushing, creating Vercel or
  Supabase projects, force pushes.
- Simple beats complex. Fix root causes. Prove a bug before fixing it.
- Never use em dashes in copy.

## Content model

- 7 lifecycle phases (Conceive, Plan, Develop, Qualify, Launch, Deliver, Retire)
  mapped to 4 AI stages (Ideation, Data, R&D, Deployment). Source: two course
  transcripts on the AI product development stages and lifecycle.
- Governance, bias testing, human review, evaluation metrics and post-launch
  monitoring are Claude's additions on top of the course material. Label them as
  such in the Field Guide.
- Content lives in `src/content/` as typed data. List and board views read the
  same data.

## Brand

- Name: "normen" wordmark (Bricolage Grotesque) with a small steel-blue "AI" pill.
- Type: Bricolage Grotesque headings, IBM Plex Sans body, IBM Plex Mono for IDs.
- Colors (tokens in `src/app/globals.css`): warm charcoal canvas #2A2925, surface
  #3A3933, orange #D67B37, steel blue #6E8590, tan #C2AE94. Each phase has its
  own color (`--color-phase-*`, from Karen's palette, 2026-11-14) used for phase
  strips via `Phase.strip`; the AI stage tags keep orange, steel, tan and ink.
- Icons: Tabler (`@tabler/icons-react`), outline style.
- Norm, the mascot (`src/components/Mascot.tsx`), is used sparingly: onboarding,
  empty states, Fit Check results and checkpoints. Never inside the Workbench views.
  One exception, chosen by Karen: a small Norm peeks over the header's bottom border
  beside the wordmark on every page (`public/brand/norm-peek.png`, with motion marks,
  cut from her ChatGPT banner and recolored to the tokens; `norm-peek-plain.png` is
  the same cutout without the marks).
- Rounded corners and pill buttons. Activity IDs use the `NRM-` prefix.

## Sections

Home (route `/`), Project Console (route `/workbench`, "Console" in the top menu; list view with a board toggle), Fit Check, Guardrails,
Scorecard, Pulse, Field Guide, Shipped. Exit criteria are "Checkpoints."
The top menu holds only Home, Console and Pulse (Karen, 2026-11-14); Guardrails,
Scorecard and Field Guide are reached from Home and the footer. Code still
names the Console "Workbench" (components, routes).

## Phase 1 milestones

1. Scaffold, theme, nav, Overview. **Done (code written, compiled in dev).**
2. Content model for all 7 phases (activities, guardrails, scorecard items,
   checkpoint criteria) and the Workbench list view. **Done.** Content in
   `src/content/lifecycle.ts` (each item tagged `course` or `claude`; Karen
   approved it 2026-11-04), demo seed in `src/content/demo.ts`, state in
   `src/state/ProjectProvider.tsx` (localStorage key `normen:project:v1`).
   Activities in locked phases are read-only.
3. Board toggle; checkpoint locking with overrides that require a logged reason.
   **Done.** Rules live in `src/state/project.ts`: a phase is current once every
   earlier phase is passed; passing needs every criterion ticked; an override
   needs a reason of 20+ characters and is kept as a dated record with the
   criteria that were open. Passes cannot be undone except by Reset demo. Board
   columns are status (To do, In progress, Done), filtered by phase. The demo
   seed passes Plan with an override (privacy review open).
4. Fit Check: 10 weighted questions; bands 70-100 good fit, 40-69 try rules or
   automation first, under 40 AI isn't the answer. Weights are Claude's design.
   **Done.** Questions, weights (sum 100) and scoring in `src/content/fitCheck.ts`;
   Karen approved them 2026-11-04. One cap, at her request: answering "serious
   harm, and nobody would catch it" forces the "AI isn't the answer" band
   whatever the total. Answers are not saved; the result is not yet linked to
   the Conceive checkpoint (possible follow-up).
5. Field Guide, Shipped, export to Markdown and PDF (print stylesheet).
   **Done.** Field Guide (`src/app/field-guide`) shows every item with a Course
   or Claude's addition tag; stage descriptions are Claude's. Shipped is the
   app's changelog, written by hand in `src/content/shipped.ts`: add an entry at
   the top with each release. Export lives on the Workbench: Markdown download
   (`src/lib/exportProject.ts`) and PDF via the browser's print dialog, which
   prints the print-only `ProjectPrint` view. App chrome uses `print:hidden`.
6. Accessibility pass (keyboard, contrast), README architecture notes.
   **Done.** axe-core (WCAG A, AA, best practice) passes on every page. Faint
   text lightened to #a5a298 and the AI pill text darkened to #0a1015 for 4.5:1
   contrast; keep new text colors at 4.5:1 or above. README has the
   architecture and accessibility notes.

State: React context plus localStorage. Many projects (milestone 7); the seeded demo is "Expense triage."
Deferred: ROI model, timeline view, Curriculum Program Designer case study,
live Scorecard/Pulse dashboards (phase 2); Supabase auth, saved projects, share
links, comments, Lighthouse CI (phase 3). Dropped: drawing tool, live HTML
embeds, Word/PPT export. (The block editor was dropped in phase 1 and brought
back by Karen on 2026-11-04; see phase 2.)

## Phase 2 plan (approved 2026-11-04)

Normen tracks real projects, modeled on Karen's PD Playbook (`Product
Development Space`). **Read the Playbook for reference only; never change it or
copy its code.** Its shape: a hub of programs with status; each program has
tabs, tabs have sections, sections hold blocks added from an "Add a block"
picker; a Tools menu; Edit/View mode; export.

Decisions (Karen, 2026-11-04):
- Structure: projects hub; each project has the 7 phases as sidebar tabs; each
  phase starts with an Overview section (blocks) and the existing Checklist
  (activities, guardrails, checkpoint); users add, rename, reorder and delete
  their own sections.
- Text blocks are plain text with line breaks. Drawing and live HTML embeds
  stay dropped.
- Admin side in phase 2: a Tools menu and an Edit/View switch. Real roles
  (admin, viewer, commenter) need sign-in and arrive with Supabase in phase 3.
- Media blocks take URLs and links only: localStorage holds about 5 MB, so no
  uploads until phase 3 storage.
- Still no server, no paid APIs. Everything saves in the browser, so backup
  and restore ship with the first milestone that lets people write.

Milestones (a mockup before each, Karen approves before any push):
7. Projects hub and project shell: create, rename, duplicate, delete; status
   (Draft, In Progress, In Review, Complete); phase tabs with sections;
   checkpoint pass dates recorded; migrate the saved v1 project; JSON backup
   and restore of all projects.
   **Done.** `/workbench` is the hub; `/workbench/<id>` (all phases),
   `/workbench/<id>/board`, `/workbench/<id>/<phase>/<section>`. Workspace
   rules in `src/state/workspace.ts`; `WorkspaceProvider` saves to
   `normen:workspace:v2`; `ProjectScope` binds the Workbench components to one
   project. The phase 1 save (`normen:project:v1`) is migrated into the demo on
   first load and left in place, never deleted. Backups are the workspace JSON;
   restore replaces every project after a confirmation. Locked phases' sections
   stay writable (only checklist items lock). Norm is not used in warning
   dialogs.
8. Block editor core: Add a block picker; Text, Callout, Divider, Table;
   reorder (drag and keyboard), delete, autosave; Edit/View switch; blocks
   included in Markdown and PDF export.
   **Done.** Types and repair in `src/content/blocks.ts`; block rules in
   `src/state/workspace.ts`; UI in `src/components/blocks/` (BlockEditor,
   BlockContent, BlockPicker). Tones: Note, Warning, Decision. Move by drag
   (wide screens), arrow buttons or Alt + Up/Down; delete shows Undo for 8
   seconds. Edit/View is per browser (`normen:mode`); a new section opens in
   Edit. The workspace saves 500 ms after changes stop and on tab hide;
   storage errors show on the section page. The picker lists milestones 9-11
   blocks as "coming". Demo overviews for Conceive, Plan and Develop have
   blocks; untouched demo pages in older saves get them on load. Seed time is
   noon UTC so dates read 4 Nov everywhere; dates show in local time.
9. Governance blocks: Decision Log, Approval Tracker, Timeline, SWOT.
   **Done.** Types in `src/content/blocks.ts`, UI in
   `src/components/blocks/GovernanceBlocks.tsx`. Statuses follow the PD
   Playbook: decisions Open, Made, On hold, Superseded; approvals Pending,
   Approved, Rejected, On hold. Timeline milestones have a Done tick (Karen
   approved) and re-sort by date when the date field loses focus. Blank rows
   show only in Edit; View and exports skip them. Removing a row has no undo.
   These blocks are a record only and never tick checkpoint criteria. The
   demo's Plan phase has a seeded "Governance" section (`plan-governance`);
   older saves get it only through Reset demo.
10. AI blocks: Risk Register, Model Card, Data Sources.
    **Done.** Claude's designs (no Playbook equivalent); Karen approved the
    mockup 2026-11-14. UI in `src/components/blocks/AiBlocks.tsx`. Risk level
    is never stored: `riskLevel()` works it out from likelihood times impact
    (1-2 low, 3-4 medium, 6-9 high). Risk types: Privacy, Bias, Accuracy,
    Security, Misuse, Operations; statuses Open, Mitigating, Accepted, Closed.
    The Model Card has fixed headings (`MODEL_FIELDS`) plus free evaluation
    rows. New data sources default to "Not sure" (personal data) and "Not
    requested" (access) so nothing looks cleared by default. Record only: no
    link to checkpoints or the Guardrails page. Demo: seeded "Model and data"
    section in Develop (`develop-model-data`).
11. Media blocks: Image, Video, File/Link (URLs only).
    **Done.** Karen approved the mockup 2026-11-14. UI in
    `src/components/blocks/MediaBlocks.tsx`; address rules in
    `src/lib/media.ts` (unit-checked by hand with node; no test runner yet).
    Only https addresses load or link. Video: YouTube (via
    youtube-nocookie), Vimeo, Loom, or .mp4/.webm; the embed address is
    rebuilt from the ID and the player loads only on Play. Images use
    `referrerPolicy="no-referrer"`; a missing description is a warning, not a
    block. The third block is a list named "Files and links". The print view
    takes `withImages`: the PDF button turns it on, waits for images (4 s
    cap), then prints; the browser's own print shortcut prints descriptions
    and addresses instead. Demo: "Prototype" section in Develop
    (`develop-prototype`, demo version 3) with `public/demo/triage-flow.svg`,
    referenced by its live address. The picker's "coming later" list is gone.
12. Tools menu: backup and restore, project changelog, status, keyboard
    shortcuts. Link the Fit Check score to the Conceive checkpoint.
    **Done.** Karen approved the mockup 2026-11-14. `ProjectToolsProvider`
    (`src/components/projects/ProjectTools.tsx`) wraps every project page and
    owns the print view, the dialogs (status, changelog, shortcuts, restore)
    and the keyboard shortcuts; `ToolsMenu` is the button. Tools is a second
    way in: status stays in the sidebar, export on All phases, backup on the
    Console. Changelog rules in `src/state/log.ts`: written by the provider's
    actions, newest first, 300 lines, one "Edited" line per section per day;
    older saves are backfilled from creation and checkpoint dates only.
    Shortcuts: ? E [ ] (switchable off, `normen:keys`), plus Alt + arrows and
    Esc. Fit Check: `/fit-check?project=<id>` skips the picker; the result is
    `project.fitCheck` (latest only) and shows under criterion C-102 as
    evidence. It never ticks or blocks the criterion. Demo version 4 seeds a
    Fit Check result.
13. Scorecard dashboard (own targets, logged readings, status per metric).
    **Done.** Karen approved the mockup 2026-11-15. Route
    `/workbench/<id>/scorecard` (sidebar link under Board); `/scorecard` lists
    every project's totals. Types in `src/content/scorecard.ts`, rules in
    `src/state/scorecard.ts`, UI in `src/components/scorecard/`. Measures are
    the 11 from `SCORECARD` plus the project's own (removable, with Undo).
    Targets are free text with the Field Guide example as a hint. A reading
    is date, value, verdict (On target, Close, Off target) and note; the user
    sets the verdict. Status = latest reading's verdict, else Not measured.
    Readings are kept in date order; deleting one has Undo. Each change
    writes the changelog (target edits once per measure per day). Record
    only: no effect on checkpoints. Demo version 5 seeds readings for S-101,
    S-201, S-301, S-302 (example figures). Included in backups, Markdown and
    print.
    Also fixed: the Fit Check page's Suspense wrapper (milestone 12) left a
    hidden duplicate of the form; FitCheck now reads `?project=` from
    `window.location` instead of `useSearchParams`.
14. Pulse (weekly drift, flagged outputs, usage trends; incident log).
    **Done.** Karen approved the mockup 2026-11-15. Route
    `/workbench/<id>/pulse` (sidebar link under Scorecard); `/pulse` lists
    every project. Types in `src/content/pulse.ts`, rules in
    `src/state/pulse.ts`, UI in `src/components/pulse/`. One check-in per
    week (Monday start, `weekStart`); uses, flagged % and sample accuracy %
    are each optional; picking a logged week loads its numbers and saving
    updates it. Alert lines: flagged above X%, and accuracy at or below
    baseline minus drop; the one place Normen compares numbers itself.
    Incidents: date, what, severity Low/Medium/High, status
    Open/Investigating/Resolved (resolving stamps the date, reopening clears
    it), what was done. Deleting a check-in or incident has Undo; every change
    writes the changelog. Charts: single series, dashed alert line, described
    in words, arrow keys read each week, table holds every number. The demo
    has not launched, so its Pulse is empty. Exports skip Pulse when empty.
15. Guardrails page with risk tiering (tier decides required guardrails).
16. ROI model (also as a calculator block).
17. Timeline view in the Workbench (uses checkpoint pass dates).
18. Curriculum Program Designer case study (needs Karen's material).

## Adding a demo page

When the demo gains a seeded custom section, bump `DEMO_VERSION` in
`src/content/demo.ts` and list the section in `DEMO_ADDED_PAGES` with that
version. `normalizeProject` then adds it to saved demos from earlier versions
(edits kept; a page deleted afterwards stays deleted). Without this, returning
visitors only get the page through Reset demo.

## Local setup note

The project folder is in iCloud Drive, which offloads `node_modules` and makes
the dev server and git hang. `node_modules` and `.next` are therefore links to
`node_modules.nosync` and `.next.nosync` (iCloud skips `.nosync`; both are
git-ignored and excluded in `tsconfig.json`). After `npm ci`, which replaces
the link with a real folder, run:
`mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules`.

## Status (2026-11-04)

- Pushed to `kburk-2026/normen-ai` (main). CI passes on every push.
- Live on Vercel Hobby at https://normen-ai.vercel.app; pushes to main deploy
  automatically.
- Commit as `343284727+kburk-2026@users.noreply.github.com` (set in this repo's
  git config); GitHub rejects pushes that expose the private email.
- Phase 1 is complete. Phase 2 milestones 7 to 14 are done. Next: milestone 15 (Guardrails page with risk tiering).
