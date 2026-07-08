---
source_import_id: "c400e9df-fa58-4dd9-bad2-8c17e6624502"
source_file: "bacariq_motion_graphics_remotion_rulebook.md"
source_section: "Core philosophy, BacarIQ style baseline, script rules, storyboard rules, visual system, motion, camera, typography, safe area, and acceptance criteria"
title: "BacarIQ Remotion Production Standard"
summary: "BacarIQ educational Remotion videos should be storyboard-first, readable, brand-consistent, voiceover-synced, and dynamic only when motion clarifies the lesson."
importance: 1
tags: ["bacariq", "remotion", "motion-graphics"]
keywords: ["BacarIQ Remotion standard", "educational motion graphics rules", "Azerbaijani motion graphics"]
---

# BacarIQ Remotion Production Standard

BacarIQ motion graphics are not considered finished because an MP4 renders successfully. The target is a professional, readable, dynamic, educational video that feels planned, brand-consistent, synchronized with the voiceover, and faithful to the storyboard.

The central lesson from failed Part 1 iterations is:

> More motion does not mean better motion.

Professional motion depends on hierarchy, timing, clean layout, clear camera logic, correct asset usage, audio sync, and frame-by-frame QA.

## Style Baseline

BacarIQ educational motion graphics should feel:

- clean
- modern
- premium
- simple
- readable
- dynamic
- Azerbaijani-language when used on screen
- educational rather than decorative
- visually consistent across parts
- suitable for YouTube long-form content
- structured enough to implement in Remotion

Preferred visual direction:

- light, white, and soft blue backgrounds
- SaaS-style card layouts
- rounded rectangles
- soft shadows
- subtle gradients
- readable typography
- clean iconography
- 2D or 2.5D motion
- controlled 3D camera-style movement only when it supports the message
- no heavy 3D unless the storyboard explicitly requires it

The motion can be dynamic, but it must never become chaotic. The viewer should always know where to look.

## Five Questions Before Implementation

Every scene must answer these questions before code is written:

1. What is on screen?
2. What moves?
3. What does the camera do?
4. What text appears?
5. How does this scene connect to the next one?

If any answer is unclear, improve the storyboard first.

## Correct Workflow

Do not jump directly from script to full Remotion implementation.

```text
Script
-> Audio / voiceover
-> Audio timing analysis
-> Text storyboard
-> Visual storyboard boards
-> Materials audit
-> Style frames
-> Remotion implementation
-> QA stills
-> Contact sheet
-> Review render
-> Fixes
-> Final render
-> Documentation update
```

Failed Part 1 attempts happened because implementation started before visual direction and asset usage were strong enough. Even when storyboards existed, Codex was allowed to interpret them too loosely.

## Educational YouTube Script Rules

Educational videos must respect viewer retention. The opening should:

- confirm the click immediately
- show the topic visually in the first seconds
- create curiosity
- avoid slow greetings
- avoid generic intros
- avoid empty first frames
- make the viewer understand why the topic matters

A typical structure:

```text
Hook
-> Problem
-> Roadmap
-> Explanation
-> Workflow / example
-> Criteria / proof setup
-> Results or demonstration
-> Comparison
-> Lesson
-> Correction / next step
-> CTA
```

Each part must provide a new reason to keep watching. Avoid repeated explanations, long text blocks, abstract claims without visuals, slow setup, long static frames, and excessive recap before payoff.

On-screen text should behave like headlines, not paragraphs.

Good short text examples:

```text
Sadə prompt problemi
Eyni input, üç fərqli AI
Nəticələr sonda açılacaq
Problem modeldə deyil
Workflow yoxdur
Əsl fərq nədədir?
```

Avoid long explanatory on-screen paragraphs.

## Storyboard Requirements

The storyboard is a production control document. Each BacarIQ part should include:

```md
# Part X - Title

## Timing
- Audio start:
- Audio end:
- Duration:
- Confidence:
- Related script section:

## Purpose
What this part teaches or makes the viewer feel.

## Viewer retention role
Hook, problem, roadmap, proof, reveal, payoff, rehook, CTA, etc.

## Visual concept
One clear description of the part.

## Scene beats
For each beat:
- timestamp range
- narration phrase
- main visual
- on-screen text
- motion behavior
- transition in
- transition out
- asset references
- Remotion notes

## On-screen text
Short text only.

## Layout direction
Composition, spacing, hierarchy, safe areas, eye flow.

## Motion direction
Exact movement: card entrance, line draw, camera push, lock pulse, chart fill, etc.

## Assets to use
Relative paths, real assets only, no invented filenames.

## Sound / music / SFX notes
Motivated sound only.

## Remotion implementation notes
Components, timing constants, data, assets, special requirements.

## Negative notes
What must not happen.
```

The storyboard must solve the visual logic before Codex writes code.

## Visual Storyboard Boards

After text storyboards, create visual storyboard boards. Each part should have:

```text
storyboard-board.png
storyboard-board.svg
storyboard-board.webp
beat-01.png
beat-02.png
beat-03.png
beat-manifest.json
README.md
```

Beat images should be 16:9 design frames, not vague sketches. The visual storyboard must show composition, hierarchy, card placement, text placement, arrows or routes, camera direction, transition intent, asset references, safe space, and the visual focus of each beat.

If the visual storyboard frame is weak as a still image, the final Remotion scene will probably fail.

## Safe Area Rules

For 2560x1440 16:9 output, use explicit safe constants:

```ts
export const STAGE = {
  width: 2560,
  height: 1440,
};

export const SAFE = {
  outer: 120,
  content: 170,
  headerTop: 90,
  bottom: 140,
};
```

Rules:

- important text must stay inside `SAFE.content`
- cards must never be cropped
- logos must not touch edges
- bottom badges must not go below `height - SAFE.bottom`
- arrowheads must stop before cards
- connector lines must not cross text
- screenshot cards must remain readable when they are the focus
- final question cards must stay centered and fully visible
- no important element should sit too close to QuickTime controls or preview platform UI

Any QA frame with crop, overflow, or collision is a failure.

## Typography Rules

Typography is one of the biggest separators between amateur and professional motion graphics.

Rules:

- use one primary font system
- use 2-3 clear type sizes
- use strong hierarchy: headline, label, badge
- keep text short
- avoid long paragraphs
- use Azerbaijani for visible lesson text
- model names can remain English
- keep contrast strong
- text must remain readable after downscaling to 1080p
- do not use tiny gray text as primary information
- do not animate text so fast that it cannot be read
- avoid centered multi-line text blocks unless intentionally designed

Preferred on-screen text sizes for 2560x1440:

```text
Hero headline: 64-96px
Section title: 52-72px
Card title: 38-52px
Label: 26-34px
Badge: 22-30px
Tiny metadata: avoid unless non-critical
```

## Color System

BacarIQ's direction is:

- white
- light blue
- blue
- purple
- small orange, green, or red accents only when meaningful

Use a restrained palette:

```text
60% dominant light background
30% supporting blue/neutral cards
10% accent colors
```

Do not use too many bright colors. Do not use neon effects unless a specific future section requires it. Do not make warning sections overly red or dramatic.

Good warning use:

```text
small red X
orange warning badge
thin red outline around broken UI
```

Bad warning use:

```text
full red background
glitch chaos
heavy alarm effects
large red overlays covering the lesson
```

## Motion Rules

Professional motion is movement with a job. Every motion must do at least one of these:

- reveal information
- guide the eye
- connect two states
- emphasize a key word
- show cause and effect
- support the voiceover
- transition cleanly to the next beat

Use:

- easing
- small anticipation
- soft spring settle
- staggered reveals
- connector line drawing
- subtle parallax
- controlled dolly or push
- small lateral truck
- hover or pulse on selected items
- highlight sweep
- one lock pulse
- UI ticks or clicks when visible actions happen

Avoid:

- random floating cards
- constant motion with no reason
- aggressive camera swings
- huge 3D rotations
- arrows flying everywhere
- repeated identical card animations
- fading in everything
- PowerPoint-style slide transitions
- static holds longer than 1.5-2 seconds without micro-motion
- motion that makes content unreadable

Motion should be dynamic but readable.

## Camera Movement

Use 2.5D camera movement carefully.

Good camera moves:

- subtle dolly-in on source screenshot
- lateral truck from source to model cards
- short push toward important result or diagnosis card
- small settle on final question
- slight parallax between background and foreground

Bad camera moves:

- huge world translation
- diagonal flying layout
- aggressive `rotateX` or `rotateY`
- camera moves that crop elements
- camera moves that create empty frames
- moving all elements at once
- camera motion added only because "3D camera movement was requested"

If camera movement hurts readability, reduce camera movement.

## Connector And Arrow Rules

Arrows caused many problems in Part 1. Use connector lines carefully.

Rules:

- prefer thin SVG connector lines over giant PNG arrows
- use a dedicated arrow corridor
- lines must not cross text
- lines must not cover screenshots
- arrowheads must stop before cards
- draw lines with `strokeDasharray` and `strokeDashoffset`
- keep stroke width modest
- keep opacity subtle
- use blue or brand accent
- use arrows only when they clarify flow
- do not leave arrows visible when no longer relevant
- do not use arrow assets if they create clutter
- replace colliding arrows with a cleaner connector line or segmented route

Example:

```tsx
<svg viewBox="0 0 2560 1440">
  <path
    d="M 780 600 C 940 600, 1080 420, 1320 420"
    stroke="#2563EB"
    strokeWidth={5}
    fill="none"
    opacity={0.75}
  />
</svg>
```

## Acceptance Criteria

A BacarIQ Remotion part is acceptable only if:

- it matches the script and storyboard
- it uses actual audio timing
- it uses relevant local materials
- it is clean and readable
- it feels dynamic but controlled
- the first frame is not empty
- no important element is cropped
- no text is unreadable
- no arrows or lines overlap text
- reveal rules are respected
- audio is synced
- SFX are subtle and motivated
- style frames look good
- the contact sheet looks good
- render resolution and FPS are correct
- documentation is updated

Reject the video if it starts with a blank or weak frame, looks like a slide deck, ignores the visual storyboard, uses weak fallbacks while real assets exist, stretches logos, contains overlaps, clutters the frame with arrows, crops important text, makes focused screenshots unreadable, has abrupt or messy transitions, lets camera motion create layout issues, stays static too long, reveals results too early, weakly syncs to speech, overpowers voice with SFX, lacks a contact sheet, skips material audit, or claims "PASS" without evidence.
