---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Prompting Codex with professional constraints"
title: "Codex Prompting For Remotion"
summary: "A production prompt framework for Remotion work, including what to specify before coding and how to iterate instead of asking for a whole video at once."
importance: 1
tags: ["codex", "prompting", "remotion"]
keywords: ["codex remotion prompt", "remotion master prompt", "goal context constraints done when"]
---

# Codex Prompting For Remotion

A strong Codex prompt for Remotion contains four fields: goal, context, constraints, and done-when criteria. For video work, those fields must include motion-specific and engineering-specific details.

| Prompt field | What to include for Remotion | Why it matters |
|---|---|---|
| Goal | What video you are making and for whom | Prevents generic "cool video" output |
| Context | Existing repo files, storyboards, screenshots, brand docs, scene list | Gives the agent the source of truth |
| Constraints | Aspect ratio, fps, duration, design tokens, animation rules, file structure, TypeScript rules | Stops visual and architectural drift |
| Done when | Preview works, lint/typecheck pass, scenes are reusable, output matches storyboard, render instructions are included | Gives Codex a quality target |

## What To Tell Codex Before It Writes Code

For complex Remotion work, start with architecture planning, not "build the whole video."

Include:

- the video purpose
- the deliverable format
- exact aspect ratio, duration, and fps
- the scene list in order
- visual references or brand rules
- the asset list
- architectural rules
- stop condition
- files Codex must read first

This matters because unspoken choices about pace, hierarchy, style, scene count, and review criteria dramatically change the codebase.

## Master Prompt Template

```md
You are a senior Remotion developer, motion graphics art director, React/TypeScript engineer, and post-production minded creative technologist.

Your task is to build or modify a professional Remotion project.

## Objective
Create a [VIDEO_TYPE] for [AUDIENCE / PRODUCT / CAMPAIGN GOAL].

## Output format
Return:
1. a proposed file/folder plan
2. the code changes
3. any new reusable components/utilities
4. render/preview instructions
5. a brief QA checklist for this specific task

## Video specs
- Aspect ratio: [16:9 / 9:16 / 1:1]
- Resolution: [1920x1080 / 1080x1920 / 1080x1080]
- Duration: [SECONDS and/or FRAMES]
- FPS: [24 / 30 / 60]
- Delivery platform: [YouTube / website hero / reels / paid social / internal demo]

## Design direction
- Brand personality: [clean / premium / playful / technical / bold / elegant]
- Color palette: [LIST TOKENS OR HEX]
- Typography: [FONT FAMILY, WEIGHTS, HIERARCHY]
- Layout approach: [grid / card-based / editorial / mobile-first / dashboard]
- Visual references: [LINK OR DESCRIBE]
- Motion style: [subtle UI / energetic promo / premium product / kinetic type]

## Scene breakdown
Scene A:
- Purpose:
- Duration in frames:
- Core content:
- Entrance animation:
- Exit / transition:
- Assets used:

Scene B:
- Purpose:
- Duration in frames:
- Core content:
- Entrance animation:
- Exit / transition:
- Assets used:

[CONTINUE FOR ALL SCENES]

## Animation rules
- Do not use CSS keyframes or transitions.
- Animate from `useCurrentFrame()`, `interpolate()`, `spring()`, `Sequence`, and shared motion utilities.
- Clamp interpolations unless overflow is intentionally part of the design.
- Prefer natural easing or springs over robotic linear motion.
- Keep motion consistent with hierarchy.

## Typography rules
- Prioritize readability and safe margins.
- Build reusable text components.
- Define font sizes, line heights, weights, and tracking in constants.
- Avoid amateur center-stacked text blocks unless intentionally designed that way.

## Code architecture
- Use TypeScript.
- One scene component per file.
- Separate `components/`, `scenes/`, `constants/`, `utils/`, `types/`, `data/`.
- Create reusable motion helpers and reusable layout primitives.
- Avoid giant files and repeated animation math.

## Assets
- Use Remotion asset components and `staticFile()` for local assets.
- Centralize font loading.
- Preserve aspect ratios of screenshots and logos.
- Do not invent missing brand assets; use placeholders with clear TODO comments if needed.

## Audio
- [Include music / include voiceover / no audio]
- If audio exists, align key visual beats to explicit frame markers.
- Add captions / subtitles if requested.
- Keep audio level decisions obvious in code.

## Rendering and export
- Include preview instructions.
- Include render command(s).
- If needed, support both local render and SSR render.
- Name output files clearly.

## Constraints
- Implement EXACTLY what is requested.
- No extra features, no extra scenes, no invented colors or tokens.
- Prefer maintainability over cleverness.
- Use comments only where they improve maintainability.
- Keep the output production-ready.

## Done when
- The composition structure is clear.
- The code is readable and reusable.
- The project previews in Remotion Studio.
- Timing is intentional and scene-based.
- Typography is readable.
- The render path is documented.

## What to avoid
- One huge component
- Hardcoded magic numbers everywhere
- CSS animations
- unreadable text
- random motion
- fake or sloppy UI
- unnecessary dependencies
```

## Good Prompts Versus Bad Prompts

| Bad prompt | Why it fails | Better professional rewrite |
|---|---|---|
| "Make me a cool SaaS video in Remotion." | No platform, brand, scenes, duration, architecture, or review criteria | Define product, audience, duration, fps, aspect ratio, storyboard, design system, file structure, motion style, assets, and done criteria |
| "Animate this dashboard." | No realism target, no hierarchy, no timing | Specify which KPI cards animate first, which charts reveal later, whether cursor or click motion is needed, and how long each beat lasts |
| "Fix this Remotion code." | No symptoms or constraints | Give the error, affected files, expected behavior, what broke, and what must remain unchanged |

## Iterative Workflow

Treat Codex as a collaborator in phases, not a vending machine.

1. Ask for architecture and folder structure only.
2. Ask for tokens and typography system.
3. Ask for scene scaffolds with durations only.
4. Ask for one scene at a time.
5. Ask for motion utilities next.
6. Ask for transitions and audio sync next.
7. Ask for refactor and code review.
8. Ask for render/export setup.
9. Ask for QA findings and fixes.
10. Accept only after preview and checks pass.

This cadence keeps the agent focused and creates reviewable checkpoints instead of one impossible diff.

