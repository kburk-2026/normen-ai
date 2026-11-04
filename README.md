# Normen AI

A seven-phase lifecycle for shipping AI in the workplace, with guardrails built into every phase.

*Normen* is German for "standards." Good AI has norms.

## What it is

Normen AI maps the seven product management lifecycle phases (Conceive, Plan, Develop, Qualify, Launch, Deliver, Retire) to the four AI product development stages (Ideation, Data, R&D, Deployment). Each phase carries its own activities, guardrails, evaluation metrics and an exit checkpoint.

## Status

| Milestone | Scope | Status |
|---|---|---|
| 1 | Scaffold, theme, navigation, Overview | Done |
| 2 | Content model, Workbench list view | Done |
| 3 | Board toggle, checkpoint locking with logged overrides | Done |
| 4 | Fit Check | Next |
| 5 | Field Guide, Shipped, export | Planned |
| 6 | Accessibility pass, architecture notes | Planned |

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS v4, with design tokens in `src/app/globals.css`
- Tabler icons, Bricolage Grotesque and IBM Plex type
- Vercel hosting; GitHub Actions builds every push

## Design decisions

- **Content is data, not markup.** Phases and stages live in `src/content/` so the list and board views read the same source.
- **Norm, the mascot, is used sparingly**: onboarding, empty states, Fit Check results and checkpoints. Working views stay clean.
- **No paid AI APIs.** The Fit Check uses transparent rule-based scoring.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
