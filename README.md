# Normen AI

A seven-phase lifecycle for shipping AI in the workplace, with guardrails built into every phase.

*Normen* is German for "standards." Good AI has norms.

Live at **https://normen-ai.vercel.app**.

## What it is

Normen AI maps the seven product management lifecycle phases (Conceive, Plan, Develop, Qualify, Launch, Deliver, Retire) to the four AI product development stages (Ideation, Data, R&D, Deployment). Each phase carries its own activities, guardrails, evaluation metrics and an exit checkpoint.

- **Workbench:** work a project through the phases in a list or board view. Pass each checkpoint to unlock the next phase, or override it with a logged reason.
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

Next: live Scorecard and Pulse dashboards (phase 2), then saved projects and sharing (phase 3).

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
    demo.ts       The seeded "Expense triage" project
    shipped.ts    The changelog
  state/        What the user has done
    project.ts          Pure rules: phase locking, passing, overrides
    ProjectProvider.tsx React context; saves to localStorage
  lib/          Helpers: Markdown export, date formatting
  components/   UI, grouped by feature (workbench/, fitcheck/)
  app/          One folder per page (App Router)
```

**Content is data, not markup.** Every phase, activity and criterion lives once in `src/content/`. The Workbench list, the board, the Field Guide, the Markdown export and the print view all read the same arrays, so a wording change shows up everywhere.

**Rules are separate from screens.** `src/state/project.ts` holds the lifecycle rules as plain functions that take a project and return a new one:

- a phase is open once every earlier checkpoint is passed;
- passing a checkpoint needs every criterion ticked;
- an override needs a reason of 20 or more characters and is kept as a dated record, with the criteria that were open at the time.

The React provider only wires those functions to the page and to `localStorage`. It starts from the demo seed so the server and browser render the same thing, then loads saved progress after the page mounts. Saves from older versions get any missing fields filled in rather than discarded.

**No server, no database (yet).** Progress lives in the visitor's browser. Supabase arrives in phase 3 for saved projects and share links.

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
