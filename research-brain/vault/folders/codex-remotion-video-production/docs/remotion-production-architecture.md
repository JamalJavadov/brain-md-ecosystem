---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Remotion foundations and production architecture"
title: "Remotion Production Architecture"
summary: "Core Remotion mental models, primitives, project structure, AGENTS.md rules, and bootstrap commands for maintainable video codebases."
importance: 1
tags: ["remotion", "architecture", "typescript"]
keywords: ["remotion project structure", "remotion agents md", "remotion production architecture"]
---

# Remotion Production Architecture

Remotion should be treated as a deterministic rendering system: for frame `f`, render exactly what should exist. Do not think "play animation over time." Think "render this React tree as a pure function of props and frame."

This mental model explains two production rules:

- avoid CSS keyframes and browser-time transitions for render-critical animation
- make scene output a pure function of props, frame, and composition metadata

## Core Remotion Concepts

| Concept | What it does | Why it matters |
|---|---|---|
| `<Composition>` | Registers a renderable video with id, duration, width, height, fps, and component | Defines output contracts and render settings |
| Component | The React unit that renders part of the video | Lets you split scenes and reusable UI/motion pieces |
| Frame | The current time unit | Every animation becomes a function of frame |
| `fps` | Frames per second | Converts visual timing from seconds to frames |
| `durationInFrames` | Total composition length | Prevents accidental truncation or extra dead air |
| `useCurrentFrame()` | Returns the current frame, relative to a sequence when inside one | Core timing hook |
| `useVideoConfig()` | Returns width, height, fps, duration, props, defaults | Lets components adapt to composition settings |
| `interpolate()` | Maps one numeric range to another | Useful for opacity, position, scale, counters |
| `spring()` | Physics-based animation primitive | Produces more natural movement than linear ramps |
| `<Sequence>` | Time-shifts children | Scene and stagger building block |
| `<AbsoluteFill>` | Full-size absolutely positioned layout wrapper | Best base layer for scenes and overlays |
| Asset tags | `<Img>`, `<Video>`, `<OffthreadVideo>`, `<Audio>`, `<Html5Audio>`, `<Html5Video>` | Deterministic asset loading and timeline sync |
| Rendering APIs | CLI or `@remotion/renderer` APIs such as `renderMedia()` | Enables automation and production exports |

## Recommended Project Structure

Separate compositions, scenes, reusable components, data, motion utilities, brand tokens, and types.

```text
my-video/
├─ public/
│  ├─ audio/
│  ├─ fonts/
│  ├─ images/
│  ├─ logos/
│  └─ video/
├─ src/
│  ├─ index.ts
│  ├─ Root.tsx
│  ├─ compositions/
│  │  ├─ MainComposition.tsx
│  │  └─ VerticalComposition.tsx
│  ├─ scenes/
│  │  ├─ IntroScene.tsx
│  │  ├─ ProblemScene.tsx
│  │  ├─ FeatureRevealScene.tsx
│  │  ├─ DashboardScene.tsx
│  │  └─ CtaScene.tsx
│  ├─ components/
│  │  ├─ typography/
│  │  ├─ layout/
│  │  ├─ motion/
│  │  ├─ ui/
│  │  └─ brand/
│  ├─ constants/
│  │  ├─ colors.ts
│  │  ├─ typography.ts
│  │  ├─ spacing.ts
│  │  ├─ timing.ts
│  │  └─ motion.ts
│  ├─ utils/
│  │  ├─ interpolate.ts
│  │  ├─ format.ts
│  │  └─ math.ts
│  ├─ hooks/
│  │  ├─ useBeatMarkers.ts
│  │  └─ useSceneProgress.ts
│  ├─ data/
│  │  ├─ storyboard.ts
│  │  ├─ transcript.json
│  │  └─ variants/
│  ├─ types/
│  │  ├─ brand.ts
│  │  ├─ props.ts
│  │  └─ scene.ts
│  └─ styles/
│     └─ globals.css
├─ AGENTS.md
├─ package.json
└─ tsconfig.json
```

The structure works because files map to responsibilities:

- scene timing lives in constants
- scene visuals live in scene components
- repeated layouts and typography live in reusable components
- variant content lives in data
- rendering contracts live in compositions

## Durable Codex Rules In AGENTS.md

Codex should not be re-taught project rules in every prompt. Put stable rules in `AGENTS.md`.

```md
# Remotion project rules

## Goal
Build clean, brand-consistent motion graphics in React + TypeScript.
Do not optimize for "quickest possible output". Optimize for maintainability and render reliability.

## Project structure
- Put renderable videos in `src/compositions/`.
- Put one scene per file in `src/scenes/`.
- Put reusable UI, layout, typography, and animation primitives in `src/components/`.
- Put all design tokens in `src/constants/`.
- Put JSON-driven content in `src/data/`.

## Motion rules
- Never use CSS keyframe animations or transitions.
- Animate only from `useCurrentFrame()`, `interpolate()`, `spring()`, and timing utilities.
- Clamp interpolations unless overflow is explicitly intended.
- Prefer soft easing or springs over linear movement for entrances and exits.
- Keep motion purposeful and tied to hierarchy.

## Typography rules
- Use only the approved fonts and weights from `src/constants/typography.ts`.
- Preserve safe margins.
- Avoid centered multi-line paragraphs unless explicitly requested.
- Prioritize readability over visual flair.

## Code quality rules
- Use TypeScript everywhere.
- No giant components.
- No magic numbers for timing, spacing, or colors.
- Prefer named constants and reusable helpers.
- Keep scene components focused and composable.

## Assets
- Use Remotion asset tags, not native HTML tags.
- Use `staticFile()` for local assets in `public/`.
- Centralize font loading.

## Validation
After changes, run:
- `npm run lint`
- `npm run typecheck`
- `npm run test` if available
- confirm the main composition previews without layout overflow

## Done when
- code is readable and typed
- scenes are reusable
- motion feels deliberate
- text is readable
- render path is documented
```

## Bootstrap Commands

For most professional teams, start with Remotion's blank template and install agent skills.

```bash
npx create-video@latest
# choose Blank
# optionally choose Tailwind if your team already uses it
# choose Agent Skills
```

Non-interactive alternative:

```bash
npx create-video --yes --blank my-video
cd my-video
npx skills add remotion-dev/skills
npm install
npm run dev
```

Preview in Remotion Studio with:

```bash
npm run dev
# or
npx remotion studio
```

Studio is the fastest place to inspect scene timing, composition metadata, and prop-driven variations.

