# Normen AI

A seven-phase lifecycle for shipping AI in the workplace, with guardrails built into every phase.

*Normen* is German for "standards." Good AI has norms.

Live at **https://normen-ai.vercel.app**.

## What it is

Normen AI maps the seven product management lifecycle phases (Conceive, Plan, Develop, Qualify, Launch, Deliver, Retire) to the four AI product development stages (Ideation, Data, R&D, Deployment). Each phase carries its own activities, guardrails, evaluation metrics and an exit checkpoint.

- **Workbench:** a hub of projects. Each project has the seven phases as tabs, each with an Overview, a Checklist and your own sections. Pass each checkpoint to unlock the next phase, or override it with a logged reason.
- **Fit Check:** ten weighted questions that tell you whether a problem needs AI at all.
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

Phase 2 turns Normen into a project tracker, modeled on a product development playbook: projects with phase tabs and sections (milestone 7, done), then a block editor for writing in each section, then the Scorecard, Pulse and Guardrails dashboards. Phase 3 adds sign-in, saved projects in the cloud, and sharing.

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
    shipped.ts    The changelog
  state/        What the user has done
    project.ts          Pure rules for one project: phase locking, passing, overrides
    workspace.ts        Pure rules for all projects: create, duplicate, sections, backups, migration
    ProjectProvider.tsx WorkspaceProvider (every project, saved to localStorage)
                        and ProjectScope (binds the Workbench to one project)
  lib/          Helpers: Markdown export, date formatting
  components/   UI, grouped by feature (projects/, workbench/, fitcheck/, ui/)
  app/          One folder per page (App Router)
```

**Content is data, not markup.** Every phase, activity and criterion lives once in `src/content/`. The Workbench list, the board, the Field Guide, the Markdown export and the print view all read the same arrays, so a wording change shows up everywhere.

**Projects and routes.** `/workbench` lists every project. A project lives at `/workbench/<id>`, with `/board` for the board view and `/<phase>/<section>` for a section page. Every phase has two fixed sections (Overview and Checklist) and any number of the user's own.

**Rules are separate from screens.** `src/state/project.ts` and `src/state/workspace.ts` hold the rules as plain functions that take data and return new data:

- a phase is open once every earlier checkpoint is passed;
- passing a checkpoint needs every criterion ticked;
- an override needs a reason of 20 or more characters and is kept as a dated record, with the criteria that were open at the time.

The React providers only wire those functions to the page and to `localStorage`. They start from the demo seed so the server and browser render the same thing, then load saved projects after the page mounts. Saves and backups from older versions get any missing fields filled in rather than discarded; the phase 1 single-project save is migrated into the demo and left in place.

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
