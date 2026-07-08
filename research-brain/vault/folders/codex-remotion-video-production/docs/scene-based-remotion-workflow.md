---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Building videos scene by scene"
title: "Scene-Based Remotion Workflow"
summary: "Storyboard-first Remotion production workflow with timeline mapping, one-scene-per-file architecture, reusable components, and transition timing warnings."
importance: 1
tags: ["remotion", "storyboard", "scene-workflow"]
keywords: ["remotion scene architecture", "remotion storyboard", "sequence timing map"]
---

# Scene-Based Remotion Workflow

The biggest professional upgrade is to stop prompting "make a video" and start prompting "build these scenes." A storyboard is the translation layer between a creative video brief and a deterministic Remotion codebase.

## Storyboard Fields

A good storyboard for Codex does not need to be cinematic. It needs five practical fields.

| Field | What to write |
|---|---|
| Purpose | Why the scene exists |
| Duration | Frames, not just seconds |
| Content | Exact on-screen message or UI state |
| Motion | Entrance, emphasis, exit |
| Assets | Logo, screenshot, icon, chart, voice line, sound cue |

## Thirty-Second SaaS Timeline At 30fps

| Scene | Frames | Time | Purpose | Notes |
|---|---:|---:|---|---|
| Intro | 0-89 | 0-3s | Brand hook | Logo lockup + headline |
| Problem | 90-209 | 3-7s | Set pain point | Kinetic typography, tighter pacing |
| Feature one | 210-389 | 7-13s | Reveal core workflow | Device mockup + cursor |
| Feature two | 390-569 | 13-19s | Prove product depth | Dashboard cards + charts |
| Social proof | 570-689 | 19-23s | Credibility | Metric counters + testimonial card |
| CTA | 690-899 | 23-30s | Close | Logo, URL, CTA, loop-friendly end |

If transitions overlap scenes, account for overlap. `<TransitionSeries>` shortens total duration because outgoing and incoming scenes render simultaneously during the transition.

## One Scene Component Per Scene

This should be a hard rule. Large scene stacks in one component become hard to retime, reuse, or debug, and agents tend to compound the problem by duplicating logic instead of abstracting it.

```tsx
// src/compositions/MainComposition.tsx
import {AbsoluteFill, Sequence} from 'remotion';
import {IntroScene} from '../scenes/IntroScene';
import {ProblemScene} from '../scenes/ProblemScene';
import {FeatureRevealScene} from '../scenes/FeatureRevealScene';
import {CtaScene} from '../scenes/CtaScene';
import {TIMING} from '../constants/timing';

export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill>
      <Sequence from={TIMING.intro.start} durationInFrames={TIMING.intro.duration}>
        <IntroScene />
      </Sequence>

      <Sequence from={TIMING.problem.start} durationInFrames={TIMING.problem.duration}>
        <ProblemScene />
      </Sequence>

      <Sequence from={TIMING.feature.start} durationInFrames={TIMING.feature.duration}>
        <FeatureRevealScene />
      </Sequence>

      <Sequence from={TIMING.cta.start} durationInFrames={TIMING.cta.duration}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

```ts
// src/constants/timing.ts
export const TIMING = {
  intro: {start: 0, duration: 90},
  problem: {start: 90, duration: 120},
  feature: {start: 210, duration: 300},
  cta: {start: 510, duration: 120},
} as const;
```

The value of this pattern is not only readability. It lets Codex safely retime or replace one scene without rewriting the whole composition.

## Reusable Professional Components

A mature Remotion codebase should not invent a new title style, card style, or gradient logic in every scene.

| Component | Purpose | Typical props |
|---|---|---|
| `<Title />` | Main display headline | text, align, maxWidth, variant |
| `<Subtitle />` | Supporting copy | text, width, tone |
| `<CTA />` | Call to action | label, sublabel, icon |
| `<SceneWrapper />` | Safe-area scene container | background, padding, align |
| `<AnimatedCard />` | Reusable revealable panel | delay, elevation, radius |
| `<AnimatedCounter />` | KPI number animation | from, to, suffix, duration |
| `<Cursor />` | Pointer and click animation | x, y, clickFrames |
| `<ProgressBar />` | Feature or timeline progress | progress, color |
| `<DeviceMockup />` | Phone or browser frame | screenshot, scale |
| `<DashboardCard />` | UI metric display | title, value, delta |
| `<ChartReveal />` | Line/bar reveal wrapper | progress, dataset |
| `<LogoLockup />` | Brand mark + wordmark | logoSrc, wordmark, size |
| `<Transition />` | Transition shell or wrapper | type, duration |
| `<BackgroundGradient />` | Reusable background system | palette, angle, noise |
| `<GridLayout />` | Responsive content grid | columns, gap, safeMargins |

## Representative Components

```tsx
// src/components/typography/Title.tsx
import {CSSProperties} from 'react';
import {TYPOGRAPHY} from '../../constants/typography';

type TitleProps = {
  text: string;
  maxWidth?: number;
  align?: CSSProperties['textAlign'];
};

export const Title: React.FC<TitleProps> = ({
  text,
  maxWidth = 1200,
  align = 'left',
}) => {
  return (
    <h1
      style={{
        margin: 0,
        maxWidth,
        fontFamily: TYPOGRAPHY.display.family,
        fontSize: TYPOGRAPHY.display.size,
        lineHeight: TYPOGRAPHY.display.lineHeight,
        letterSpacing: TYPOGRAPHY.display.letterSpacing,
        fontWeight: TYPOGRAPHY.display.weight,
        textAlign: align,
      }}
    >
      {text}
    </h1>
  );
};
```

```tsx
// src/components/layout/SceneWrapper.tsx
import {AbsoluteFill} from 'remotion';
import {COLORS, SPACING} from '../../constants/tokens';

type SceneWrapperProps = {
  children: React.ReactNode;
  background?: string;
};

export const SceneWrapper: React.FC<SceneWrapperProps> = ({
  children,
  background = COLORS.bg,
}) => {
  return (
    <AbsoluteFill
      style={{
        background,
        padding: `${SPACING.safeY}px ${SPACING.safeX}px`,
        boxSizing: 'border-box',
        display: 'flex',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
```

```tsx
// src/components/motion/AnimatedCounter.tsx
import {interpolate, useCurrentFrame} from 'remotion';

type AnimatedCounterProps = {
  from: number;
  to: number;
  duration: number;
  suffix?: string;
};

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from,
  to,
  duration,
  suffix = '',
}) => {
  const frame = useCurrentFrame();
  const value = Math.round(
    interpolate(frame, [0, duration], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return <span>{value.toLocaleString()}{suffix}</span>;
};
```

## Transition Example

```tsx
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';

export const BasicTransitionExample: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <div>Scene A</div>
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({durationInFrames: 15})}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <div>Scene B</div>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

