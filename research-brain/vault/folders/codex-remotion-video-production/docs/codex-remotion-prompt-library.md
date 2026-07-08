---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Prompt library, checklist, and operating workflow - Copy-paste prompt templates"
title: "Codex Remotion Prompt Library"
summary: "Reusable Codex prompt templates for new Remotion projects, scene builds, SaaS demos, typography, animation utilities, refactors, audio sync, variants, data templates, rendering, and debugging."
importance: 1
tags: ["codex", "prompt-library", "remotion"]
keywords: ["remotion prompt templates", "codex remotion prompts", "remotion debugging prompt"]
---

# Codex Remotion Prompt Library

These templates follow a goal/context/constraints/done-when contract and Remotion's scene-driven architecture. Adapt them to the repo instead of pasting them blindly.

## New Remotion Project

```md
Create the architecture for a new professional Remotion project.

Goal:
Build a clean TypeScript Remotion codebase for [VIDEO TYPE].

Context:
- blank Remotion project
- target platform: [YouTube / social / website / paid ads]
- aspect ratio: [16:9 / 9:16 / 1:1]
- duration: [SECONDS]
- fps: [FPS]
- brand style: [DESCRIBE]

Constraints:
- use `src/compositions`, `src/scenes`, `src/components`, `src/constants`, `src/utils`, `src/types`, `src/data`
- one scene per file
- create reusable typography and motion utilities
- no CSS animations
- use tokens for color, spacing, radius, typography, and timing
- TypeScript only

Done when:
- folder structure is created
- root composition is registered
- shared tokens exist
- one placeholder scene per planned section exists
- preview instructions are included
```

## Scene-By-Scene Video Build

```md
Build this Remotion video scene by scene, not as one giant component.

Video specs:
- aspect ratio: [VALUE]
- resolution: [VALUE]
- duration: [VALUE]
- fps: [VALUE]

Storyboard:
- Scene A: [PURPOSE, FRAMES, CONTENT, MOTION]
- Scene B: [PURPOSE, FRAMES, CONTENT, MOTION]
- Scene C: [PURPOSE, FRAMES, CONTENT, MOTION]

Constraints:
- create one React component per scene
- centralize timing in constants
- create reusable text/layout primitives
- do not invent extra scenes
- keep all animations frame-driven and deterministic

Output:
- folder plan
- timing map
- code per scene
- composition assembly code
```

## SaaS Product Demo

```md
Create a polished SaaS product demo in Remotion.

Objective:
Explain how [PRODUCT NAME] helps [AUDIENCE] do [JOB TO BE DONE].

Specs:
- 16:9
- 1920x1080
- 30fps
- 30 seconds

Scenes:
- Hook with headline
- Problem statement
- Feature walkthrough with UI
- Metrics/dashboard proof
- CTA

Design rules:
- premium SaaS visuals
- realistic UI spacing and hierarchy
- cursor motion only where meaningful
- readable typography
- subtle, confident motion

Architecture rules:
- `DashboardCard`, `Cursor`, `DeviceMockup`, `ChartReveal`, `Title`, `CTA`
- no fake impossible UI elements
- separate scenes from reusable UI components

Done when:
- the story is clear
- the UI feels usable
- motion is polished
- render instructions are included
```

## Kinetic Typography Reel

```md
Build a kinetic typography reel in Remotion.

Video specs:
- 9:16
- 1080x1920
- 30fps
- 20 seconds

Requirements:
- strong editorial typography
- staggered word reveals
- alternating scale, opacity, and position emphasis
- no random gimmick motion
- maintain clear readability on mobile
- use reusable text animation utilities
- one section per statement

Text:
[PASTE SCRIPT]

Avoid:
- cluttered text stacks
- weak contrast
- linear robotic motion
- too many simultaneous effects
```

## Dashboard Animation

```md
Build a dashboard animation scene in Remotion.

Requirements:
- show 3 KPI cards, 1 chart, 1 notification panel
- realistic component spacing
- staggered reveals in hierarchy order
- use reusable dashboard components
- metrics should animate cleanly from data
- chart should reveal progressively
- keep the design believable for a real product

Output:
- scene component
- reusable card and chart components
- any motion utilities needed
```

## Logo Intro

```md
Create a professional logo intro in Remotion.

Brand:
- logo asset: [PATH]
- tone: [premium / bold / playful / cinematic / minimalist]
- colors: [TOKENS]
- duration: [FRAMES]
- aspect ratio: [VALUE]

Rules:
- keep the focus on the brand mark
- motion should feel intentional and brand-appropriate
- no cheesy spins or overused whooshes unless explicitly requested
- build reusable `LogoLockup` and `BackgroundGradient` components
- include an optional end state that can flow into a larger composition
```

## App UI Animation

```md
Create an app UI animation scene in Remotion.

Context:
- source screenshot(s): [PATHS]
- target interaction: [onboarding / editing / analytics / settings / checkout]
- duration: [FRAMES]

Requirements:
- preserve screenshot proportions
- animate scroll, cursor, hover, click, or panel changes realistically
- use depth and hierarchy sparingly
- create reusable device/browser frame wrappers
- do not distort the product UI
```

## Reusable Animation Utilities

```md
Create reusable Remotion animation utilities for this project.

Requirements:
- TypeScript
- create helpers for fade, slide, scale reveal, stagger delay, counter, and CTA emphasis
- use `interpolate`, `Easing`, and `spring`
- clamp values unless intentional overflow is needed
- include clear function names and example usage
- avoid scene-specific logic inside utilities
```

## Reusable Typography Components

```md
Create a professional typography system for this Remotion repo.

Requirements:
- components: `Title`, `Subtitle`, `Body`, `Caption`, `CTA`
- central token file for family, size, weight, line height, tracking
- consistent safe widths
- readable on both 16:9 and 9:16
- centralized font loading
- example usage in one scene
- no hardcoded font values inside scene files
```

## Refactor Messy Remotion Code

```md
Refactor this Remotion codebase for maintainability without changing the visual result.

Focus on:
- splitting huge components
- extracting repeated animation math
- removing magic numbers into constants
- improving type safety
- separating scenes from reusable components
- strengthening naming and comments where useful

Constraints:
- preserve the current output as closely as possible
- do not redesign the visuals
- include a brief before/after architecture summary
```

## Audio Sync Pass

```md
Add professional audio sync to this Remotion project.

Context:
- music: [PATH]
- voiceover: [PATH if any]
- existing scenes: [FILES]

Requirements:
- add frame markers for major beats or spoken phrases
- align key entrances/exits to those markers
- use frame-based volume automation
- keep music under voice where needed
- add only restrained transition/UI sound cues if appropriate
- document the cue map in constants
```

## Responsive Landscape And Vertical Variants

```md
Create both 16:9 and 9:16 variants of this Remotion video.

Requirements:
- preserve the same story
- adapt layout, typography scale, and spacing for each format
- do not simply scale the landscape design down
- centralize aspect-ratio-aware tokens or layout helpers
- keep scenes reusable where possible
- include both compositions in `Root.tsx`
```

## Data-Driven Video System

```md
Turn this Remotion project into a data-driven template.

Requirements:
- define Zod schema(s) for props
- accept input props for text, metrics, colors, and optional assets
- keep fallback default props for Studio preview
- support batch rendering from JSON
- isolate business data from presentational components
- include one sample props file and one render command
```

## Render And Export Setup

```md
Create a professional render/export setup for this Remotion repo.

Requirements:
- document Studio preview
- document CLI render commands
- add one SSR render example using `bundle`, `selectComposition`, and `renderMedia`
- recommend export presets for client review, YouTube, vertical social, and website hero
- use clear output naming conventions
- keep instructions practical and repo-specific
```

## Remotion Debugging

```md
Debug a Remotion issue in this repo.

Problem:
[PASTE ERROR MESSAGE OR VISUAL BUG]

Context:
- composition id: [VALUE]
- affected files: [LIST]
- reproduction steps: [LIST]
- expected result: [DESCRIBE]
- actual result: [DESCRIBE]

Requirements:
- inspect likely causes in order: props/timing, asset paths, fonts, async loading, transitions, layout overflow
- identify root cause before refactoring
- make the smallest high-confidence fix first
- provide verification steps for Studio and render
```

