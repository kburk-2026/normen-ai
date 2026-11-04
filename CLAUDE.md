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
  #3A3933, orange #D67B37, steel blue #6E8590, tan #C2AE94.
- Icons: Tabler (`@tabler/icons-react`), outline style.
- Norm, the mascot (`src/components/Mascot.tsx`), is used sparingly: onboarding,
  empty states, Fit Check results and checkpoints. Never inside the Workbench views.
  One exception, chosen by Karen: a small Norm peeks over the header's bottom border
  beside the wordmark on every page (`public/brand/norm-peek.png`, with motion marks,
  cut from her ChatGPT banner and recolored to the tokens; `norm-peek-plain.png` is
  the same cutout without the marks).
- Rounded corners and pill buttons. Activity IDs use the `NRM-` prefix.

## Sections

Overview, Workbench (list view with a board toggle), Fit Check, Guardrails,
Scorecard, Pulse, Field Guide, Shipped. Exit criteria are "Checkpoints."

## Phase 1 milestones

1. Scaffold, theme, nav, Overview. **Done (code written, compiled in dev).**
2. Content model for all 7 phases (activities, guardrails, scorecard items,
   checkpoint criteria) and the Workbench list view. Karen reviews content.
3. Board toggle; checkpoint locking with overrides that require a logged reason.
4. Fit Check: 10 weighted questions; bands 70-100 good fit, 40-69 try rules or
   automation first, under 40 AI isn't the answer. Weights are Claude's design.
5. Field Guide, Shipped, export to Markdown and PDF (print stylesheet).
6. Accessibility pass (keyboard, contrast), README architecture notes.

State: React context plus localStorage. One seeded demo project, "Expense triage."
Deferred: ROI model, timeline view, Curriculum Program Designer case study,
live Scorecard/Pulse dashboards (phase 2); Supabase auth, saved projects, share
links, comments, Lighthouse CI (phase 3). Dropped: block editor, drawing tool,
Word/PPT export.

## Status (2026-11-04)

- Pushed to `kburk-2026/normen-ai` (main). CI passes on every push.
- Live on Vercel Hobby at https://normen-ai.vercel.app; pushes to main deploy
  automatically.
- Commit as `343284727+kburk-2026@users.noreply.github.com` (set in this repo's
  git config); GitHub rejects pushes that expose the private email.
- Next: milestone 2.
