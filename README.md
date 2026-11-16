# Normen AI

A seven-phase lifecycle for shipping AI in the workplace, with guardrails built into every phase.

*Normen* is German for "standards." Good AI has norms.

Live at **https://normen-ai.vercel.app**.

## What it is

Normen AI maps the seven product management lifecycle phases (Conceive, Plan, Develop, Qualify, Launch, Deliver, Retire) to the four AI product development stages (Ideation, Data, R&D, Deployment). Each phase carries its own activities, guardrails, evaluation metrics and an exit checkpoint.

- **Workbench:** a hub of projects. Each project has the seven phases as tabs, each with an Overview, a Checklist and your own sections. Write in the Overview and your own sections with blocks: text, callouts, dividers and tables, plus a Decision Log, Approval Tracker, Timeline and SWOT, three AI blocks (Risk Register, Model Card, Data Sources) and three media blocks (Image, Video, Files and links). Pass each checkpoint to unlock the next phase, or override it with a logged reason.
- **Scorecard:** each project's measures, targets and logged readings, with your own call on each reading.
- **Pulse:** weekly check-ins once a project is in use, trend charts against your own alert lines, and an incident log.
- **Guardrails:** five questions set each project's risk tier, and the tier decides which guardrails it must have.
- **ROI:** what a project saves against what it costs, with payback and a cautious case. Also a calculator block.
- **Fit Check:** ten weighted questions that tell you whether a problem needs AI at all. Save the score to a project and it shows as evidence on the Conceive checkpoint.
- **Field Guide:** the whole method, with every item labeled as course material or Claude's addition.
- **Shipped:** what changed in the app, and when.

## Status

| Milestone | Scope | Status |
|---|---|---|
| 1 | Scaffold, theme, navigation, Overview | Done |
| 2 | Content model, Workbench list view | Done |
| 3 | Board toggle, checkpoint locking with logged overrides | Done |
| 4 | Fit Check | Done |
| 5 | Field Guide, Shipped, export | Done |
| 6 | Accessibility pass, architecture notes | Done |

Phase 2 turns Normen into a project tracker, modeled on a product development playbook: projects with phase tabs and sections (milestone 7, done), a block editor for writing in each section (milestone 8, done), governance blocks (milestone 9, done), AI blocks (milestone 10, done), media blocks (milestone 11, done), a Tools menu, changelog and saved Fit Check results (milestone 12, done), the Scorecard (milestone 13, done), Pulse (milestone 14, done), and Guardrails with risk tiering (milestone 15, done), an ROI model (milestone 16, done), then a timeline view. Phase 3 adds sign-in, saved projects in the cloud, and sharing.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS v4, with design tokens in `src/app/globals.css`
- Tabler icons; Bricolage Grotesque and IBM Plex type, bundled in `src/fonts`
- Vercel hosting; GitHub Actions builds every push

## Architecture

```
src/
  content/      What the app knows, as typed data
    phases.ts     The 7 phases and 4 AI stages
    lifecycle.ts  Activities, guardrails, scorecard items, checkpoint criteria
    fitCheck.ts   Fit Check questions, weights and scoring
    demo.ts       Project and section types; the seeded "Expense triage" project
    blocks.ts     Block types, new blocks, and repair of saved blocks
    shipped.ts    The changelog
  state/        What the user has done
    project.ts          Pure rules for one project: phase locking, passing, overrides
    workspace.ts        Pure rules for all projects: create, duplicate, sections, blocks, backups, migration
    editMode.ts         Small browser preferences: Edit/View, and single-key shortcuts on or off
    log.ts              The per-project changelog: what gets recorded, and the backfill for older saves
    scorecard.ts        Scorecard rules: measures, status from the latest reading, repair of saved data
    pulse.ts            Pulse rules: weeks, alert lines, incidents, repair of saved data
    guardrails.ts       Risk tier from the five answers, required guardrails per tier, statuses
    ProjectProvider.tsx WorkspaceProvider (every project, saved to localStorage)
                        and ProjectScope (binds the Workbench to one project)
  lib/          Helpers: Markdown export, date formatting, media address rules, ROI arithmetic
  components/   UI, grouped by feature (projects/, blocks/, workbench/, fitcheck/, ui/)
  app/          One folder per page (App Router)
```

**Content is data, not markup.** Every phase, activity and criterion lives once in `src/content/`. The Workbench list, the board, the Field Guide, the Markdown export and the print view all read the same arrays, so a wording change shows up everywhere.

**Projects and routes.** `/workbench` lists every project. A project lives at `/workbench/<id>`, with `/board` for the board view and `/<phase>/<section>` for a section page. Every phase has two fixed sections (Overview and Checklist) and any number of the user's own.

**Sections hold blocks.** Every section except the Checklist holds a list of blocks. A block is plain data (`{ id, type, ... }`); `BlockContent` draws each type as an editor or as the finished page, and the Markdown and print exports read the same data. Saved blocks are repaired on load: unknown types are dropped and missing fields filled in.

**Media by address, loaded with care.** Media blocks hold web addresses, not files (`src/lib/media.ts` has the rules). Only `https` addresses are loaded or linked. A video's player address is rebuilt from the video's ID for YouTube, Vimeo and Loom, and nothing loads from the video site until the reader presses play. Images are requested without a referrer, and the hidden print view loads them only when the PDF button is pressed.

**A changelog that writes itself.** Actions that change a project add a line to its changelog (`src/state/log.ts`): status, checkpoints, sections, saved Fit Check results, and one "Edited" line per section per day. It keeps the latest 300 lines. Projects saved before the changelog existed get lines only for what the save already records.

**The Scorecard keeps people in charge.** Targets are written in words and each reading carries the person's own verdict (on target, close, off target); Normen never works the verdict out, because many targets are not numbers. A measure's status is its latest reading's verdict. The trend line uses the first number in each reading, and is described in words for screen readers.

**Charts that can be read without seeing them.** Pulse charts show one measure each (never two axes), with a dashed alert line. Every chart is described in words, can be read week by week with the arrow keys, and sits above a table holding every number. Weeks past an alert line carry a warning icon and words, never color alone.

**Risk tiers take the worst answer, not an average.** Each of the five tier questions points to Low, Medium or High, and the project takes the highest, so one serious answer (sensitive data, decisions about people made on their own) is enough for High. Each tier requires its own guardrails plus every lower tier's. The rules are Claude's design and the Field Guide says so.

**ROI arithmetic in the open.** The ROI model (`src/lib/roi.ts`) is plain arithmetic on the user's own numbers, shown line by line under "Show the working" and in the exports. A cautious case (half the share of tasks, half the minutes saved) always sits beside the expected one.

**Evidence, not gates.** A saved Fit Check score appears under the Conceive criterion it supports, but never ticks or blocks it. The same holds for the governance and AI blocks: they record what people decided.

**Rules are separate from screens.** `src/state/project.ts` and `src/state/workspace.ts` hold the rules as plain functions that take data and return new data:

- a phase is open once every earlier checkpoint is passed;
- passing a checkpoint needs every criterion ticked;
- an override needs a reason of 20 or more characters and is kept as a dated record, with the criteria that were open at the time.

The React providers only wire those functions to the page and to `localStorage`, writing half a second after changes stop (and at once when the tab is hidden or closed). The section page shows Saving, Saved, or a warning if the browser refuses to store the change. They start from the demo seed so the server and browser render the same thing, then load saved projects after the page mounts. Saves and backups from older versions get any missing fields filled in rather than discarded, and a saved demo picks up demo pages added since (the demo carries a version number); the phase 1 single-project save is migrated into the demo and left in place.

**No server, no database (yet).** Projects live in the visitor's browser, so the hub offers a one-file backup and restore. Supabase arrives in phase 3 for saved projects and share links.

**Export without a library.** Markdown is built from the project data and downloaded from the browser. PDF uses the browser's own print dialog: a print-only view (`ProjectPrint`) shows every phase expanded in black on white, and the app's header, footer and controls are hidden with Tailwind's `print:` variant.

**Builds have no network dependencies.** Fonts ship in the repo, so CI and Vercel never reach Google Fonts.

## Accessibility

Checked against WCAG 2.1 AA in milestone 6:

- Every page passes an axe-core scan (WCAG A, AA and best-practice rules), including the Workbench with all phases open, the board view and a completed Fit Check.
- Every text color meets 4.5:1 contrast against the backgrounds it sits on.
- Everything works by keyboard, in a logical order, with a visible focus outline and a skip link. The override dialog traps focus, starts in the reason box and closes with Escape.
- Form controls have labels. Status buttons announce the activity, its status and what a click will do. Phase rows read as "Phase 2, Plan, 5 of 5 activities done, passed with override".
- Headings run in order on every page.
- Scrolling respects the system's reduced-motion setting.
- Single-key shortcuts (?, E, [ and ]) can be switched off, never fire while typing in a field, and are listed in a dialog (WCAG 2.1.4).
- Blocks move without a mouse (arrow buttons, or Alt + Up / Down), and adding, moving and deleting a block is announced to screen readers. Checked with axe in milestone 8 with the block picker open and in View mode.

## Design decisions

- **Norm, the mascot, is used sparingly:** a small peeking Norm in the header, then only onboarding, empty states, Fit Check results and checkpoints. The working views themselves stay clean.
- **No paid AI APIs.** The Fit Check uses transparent, rule-based scoring. Its weights add up to 100, and one answer (serious harm that nobody would catch) caps the result regardless of the total.
- **Honest sources.** Items from the course material and Claude's additions are labeled separately in the Field Guide. Scorecard targets are examples, not recommendations.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
