---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Prompt library, checklist, and operating workflow - Professional review checklist and complete operating workflow"
title: "Remotion Production Review Checklist"
summary: "A pre-render review gate for Codex-assisted Remotion work, covering strategy, storyboard, timing, brand, typography, motion, UI realism, audio, code quality, QA, and final delivery."
importance: 1
tags: ["remotion", "review-checklist", "production-workflow"]
keywords: ["remotion qa checklist", "remotion production workflow", "codex remotion review"]
---

# Remotion Production Review Checklist

Use this as a pre-render gate for Codex-assisted Remotion projects. The source checklist contains one hundred points; this cleaned version keeps the checks grouped by discipline.

## Strategy And Brief

| Check |
|---|
| The video has one clear objective. |
| The target audience is explicit. |
| The platform or placement is known. |
| The aspect ratio matches the platform. |
| The duration fits the use case. |
| The CTA is defined before design starts. |
| The success metric is known. |
| The tone matches the brand. |
| The video is structured around a message, not just visuals. |
| Codex received a clear definition of done. |

## Script And Storyboard

| Check |
|---|
| The script is approved before polish begins. |
| Every scene has a purpose. |
| Every scene has a frame duration. |
| Every scene has a content description. |
| Every scene has an entrance idea. |
| Every scene has an exit or transition plan. |
| No scene is redundant. |
| Pacing builds logically. |
| The CTA is not rushed. |
| Timing supports comprehension, not just speed. |

## Scene Structure And Timing

| Check |
|---|
| One scene equals one scene component file. |
| A timing map exists in constants. |
| Total frames equal the intended runtime. |
| Transition overlaps are accounted for. |
| `useCurrentFrame()` logic is local and readable. |
| Absolute frame is passed down only where needed. |
| Sequences are used intentionally. |
| No scene is packed into a monolithic component. |
| Scene order is easy to inspect in the composition file. |
| Frame math does not depend on guesswork. |

## Design System And Brand

| Check |
|---|
| Brand colors are tokenized. |
| Typography tokens are centralized. |
| Spacing tokens are centralized. |
| Radius and shadow tokens are centralized. |
| Codex did not invent extra colors. |
| Codex did not invent extra fonts. |
| Backgrounds match the brand system. |
| Icons and logos are used consistently. |
| The visual language feels like one system. |
| The project can be rethemed without rewriting scenes. |

## Typography

| Check |
|---|
| Headlines are readable at first glance. |
| Body copy is not too small. |
| Line heights are appropriate. |
| Letter spacing is intentional. |
| Text contrast meets readability needs. |
| Multi-line breaks are visually clean. |
| Text stays inside safe margins. |
| Captions do not fight the main headline. |
| CTA text is concise and legible. |
| No scene uses amateur stacked text layouts by accident. |

## Motion Design

| Check |
|---|
| Motion reflects hierarchy. |
| Major elements do not all animate at once. |
| Easing is deliberate, not default linear everywhere. |
| Springs feel controlled rather than bouncy for no reason. |
| Interpolations are clamped where needed. |
| Entrances and exits belong to one motion system. |
| Secondary motion is subtle. |
| No animation feels random. |
| Timing allows viewers to understand what changed. |
| There are no CSS keyframe animations. |

## SaaS And UI Realism

| Check |
|---|
| Screenshots preserve proper aspect ratio. |
| Browser or device frames look believable. |
| Cursor motion is purposeful. |
| Click states are subtle, not cartoonish. |
| UI spacing resembles a real product. |
| Chart reveals feel plausible. |
| KPI counters map to actual numbers. |
| Hover states are restrained. |
| Notifications or toasts do not feel fake. |
| The scene communicates product value clearly. |

## Audio And Captions

| Check |
|---|
| Voiceover timing matches visuals. |
| Music does not overpower spoken content. |
| Audio fades are controlled in frames. |
| Sound effects are not overused. |
| Transition audio aligns with transition visuals. |
| Captions are readable and branded. |
| Silence is used intentionally where helpful. |
| The start and end of tracks are clean. |
| Audio cues are documented in constants or comments. |
| The final mix supports the story, not just energy. |

## Code Quality And Performance

| Check |
|---|
| TypeScript types are meaningful and clean. |
| No repeated animation code should have been a helper. |
| No giant prop objects are hardcoded into scenes unnecessarily. |
| Async loading paths are explicit. |
| Font loading is centralized. |
| Assets use Remotion tags appropriately. |
| Naming is readable and consistent. |
| Scene files remain focused. |
| Lint/typecheck commands pass. |
| The code looks maintainable to another engineer. |

## QA, Render, And Deliverables

| Check |
|---|
| The project previews correctly in Studio. |
| The main composition renders successfully. |
| Final resolution matches the destination. |
| Codec and format fit the destination. |
| Output files use consistent naming. |
| Vertical and square crops were reviewed if needed. |
| No last-frame dead air or abrupt cut remains. |
| Poster or thumbnail frames are acceptable if needed. |
| Render instructions are documented for teammates. |
| The result is good enough to reuse as a template, not just ship once. |

## Complete Operating Workflow

1. Define the business objective.
2. Define the destination platform and aspect ratio.
3. Write the script or content outline.
4. Turn the script into a scene list.
5. Assign frame durations to scenes.
6. Define the visual style and brand references.
7. Define the typography system.
8. Define tokens for color, spacing, radius, and motion.
9. Gather assets and place local assets in `public/`.
10. Scaffold or clean the Remotion repo.
11. Install Remotion Agent Skills if they are not already present.
12. Add or update `AGENTS.md`.
13. Ask Codex to plan the architecture before implementation.
14. Build reusable typography, layout, and motion primitives first.
15. Build scenes one by one.
16. Assemble them in compositions with shared timing constants.
17. Add transitions only after core scenes read well.
18. Add audio timing and captions.
19. Preview in Remotion Studio and inspect key frames.
20. Ask Codex to refactor duplication and enforce types.
21. Ask Codex to run lint, type, and test checks where available.
22. Render review exports.
23. Fix edge cases in mobile, square, or alternate variants.
24. Render final deliverables.
25. Archive the composition, prompts, tokens, and reusable components as a template.

