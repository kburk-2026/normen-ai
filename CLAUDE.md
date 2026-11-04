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
- Phase 1 is complete. Next: phase 2 (live Scorecard and Pulse dashboards).
