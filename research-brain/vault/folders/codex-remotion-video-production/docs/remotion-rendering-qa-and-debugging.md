---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Performance, QA, rendering, and debugging"
title: "Remotion Rendering QA And Debugging"
summary: "Production checks, render commands, SSR rendering pattern, export presets, and debugging prompts for Remotion projects."
importance: 1
tags: ["remotion", "qa", "rendering"]
keywords: ["remotion render command", "remotion ssr render", "remotion debugging"]
---

# Remotion Rendering QA And Debugging

Do not stop at generation. A Remotion project can look acceptable on one frame and still be wrong across time, aspect ratios, audio sync, prop variants, or render environments.

## Code Quality Rules

| Rule | Why it matters |
|---|---|
| Keep components small | Easier refactors and scene review |
| Avoid repeated math | Fewer timing inconsistencies |
| Avoid unnecessary effects | Better purity, fewer render bugs |
| Use named constants | Easier global retiming |
| Use proper keys in lists | Stable React rendering when mapping dynamic items |
| Keep props structured and typed | Safer data-driven rendering |
| Keep async loading explicit | Avoid timeouts and flicker |
| Prefer Remotion asset tags | Render waits for assets correctly |
| Centralize font loading | Avoid missing-font render failures |
| Refactor after generation | AI-first drafts are rarely final drafts |

## Preview And QA Workflow

Use Remotion Studio for preview:

```bash
npm run dev
# or
npx remotion studio
```

For serious review, do not inspect only the timeline start. Scrub key entrances, overlaps, dense text moments, and audio transitions. Check prop-driven variants because real content lengths often reveal layout failures.

A disciplined QA pass should verify:

- frame timing
- scene overlap and transition math
- text contrast and readability
- safe margins for vertical and square variants
- asset loading and font loading
- audio sync and level ramps
- screenshot cropping and device frames
- final render quality at target resolution

## CLI Rendering

```bash
# Preview
npm run dev

# Render with default props
npx remotion render MainComposition out/main.mp4

# Render with JSON props
npx remotion render MainComposition out/main.mp4 --props=./props/report.json
```

## Server-Side Rendering Pattern

The SSR path is: bundle the project, select a composition and calculate metadata, then render media or stills.

```ts
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition, renderMedia} from '@remotion/renderer';

const entryPoint = path.resolve('./src/index.ts');

const serveUrl = await bundle({
  entryPoint,
});

const inputProps = {
  headline: 'Growth report',
};

const composition = await selectComposition({
  serveUrl,
  id: 'ReportVideo',
  inputProps,
});

await renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: 'out/report.mp4',
  inputProps,
});
```

## Export Presets

| Destination | Practical default |
|---|---|
| Client review | MP4, H.264, AAC, 1080p, 30fps |
| YouTube | MP4, H.264, AAC, 1920x1080 or native aspect ratio, 30fps unless content needs higher |
| Vertical social | MP4, H.264, AAC, 1080x1920, 30fps |
| Square social | MP4, H.264, AAC, 1080x1080, 30fps |
| Website hero | MP4, H.264, no-bloat duration, usually muted loop, plus a poster frame |
| High-volume batch export | SSR render pipeline with JSON props and consistent naming |

Suggested naming convention:

```text
[brand]-[campaign]-[aspect]-[language]-[version].mp4
acme-q3-report-16x9-en-v03.mp4
```

## Recurring Debugging Causes

The source guide identifies these recurring causes:

- unresolved `delayRender()` handles
- assets not loaded or seekable
- font-loading issues
- CSS animations
- silence or unnecessary audio download overhead
- flickering from nondeterministic behavior
- incorrect timing math
- transition overlap mistakes
- layout overflow

Prefer scoped async handling such as `useDelayRender()` where appropriate.

## Debugging Prompt

```md
Debug this Remotion issue.

Symptom:
- [paste error / describe visual bug]

Context:
- affected files: [LIST]
- composition id: [ID]
- render path: [Studio / CLI / SSR]
- expected behavior: [DESCRIBE]
- current behavior: [DESCRIBE]

Requirements:
- identify root cause first
- propose minimal high-confidence fixes
- keep architecture intact unless a deeper refactor is necessary
- tell me what commands to run to verify
- if timing math is wrong, show the corrected frame logic
```

## Production Review Prompt

```md
Review this Remotion scene for production quality.

Focus on:
- timing drift
- misuse of `useCurrentFrame()`
- unclamped interpolations
- typography readability
- layout overflow
- hardcoded values
- duplicated animation math
- asset loading risks
- refactor opportunities

Output:
- findings by severity
- exact file changes recommended
- what to test after the fixes
```

