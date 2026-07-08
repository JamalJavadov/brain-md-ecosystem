---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Designing motion, typography, UI, data, and sound"
title: "Remotion Motion Typography And UI"
summary: "Practical Remotion rules for code-driven motion, animation utilities, typography systems, responsive layout, and realistic SaaS UI scenes."
importance: 1
tags: ["remotion", "motion-design", "typography"]
keywords: ["remotion animation utilities", "remotion typography system", "saas ui motion graphics"]
---

# Remotion Motion Typography And UI

Professional Remotion design is not about random movement. Timing, hierarchy, typography, spacing, and UI realism must be encoded as reusable code decisions.

## Motion Principles In Code

| Principle | Code translation |
|---|---|
| Timing | Decide how many frames each action gets |
| Spacing | Make positions follow clear distance logic |
| Easing | Avoid default linear unless the effect is intentionally machine-like |
| Anticipation | Add a subtle pre-motion or opacity cue before major movement |
| Overlap | Let supporting elements follow the primary element by a few frames |
| Motion hierarchy | The most important item moves first, largest, or smoothest |
| Stagger | Reveal text, cards, or metrics with offset frames |
| Secondary motion | Add subtle shadow, scale, or parallax after the main action |
| Transition coherence | Enter, emphasis, and exit should feel like one system |

## Reliable Motion Utilities

```tsx
// src/utils/motion.ts
import {Easing, interpolate, spring} from 'remotion';

export const fadeIn = (frame: number, start: number, duration: number) => {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
};

export const slideUp = (
  frame: number,
  start: number,
  duration: number,
  distance = 40,
) => {
  return interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
};

export const scaleReveal = (
  frame: number,
  fps: number,
  delay = 0,
) => {
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 18,
      stiffness: 120,
      mass: 0.8,
    },
  });
};
```

Remotion animation values should usually be clamped unless overshoot is intentional.

## Canonical Animation Patterns

```tsx
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fadeIn, slideUp} from '../utils/motion';

export const SlideInExample: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = fadeIn(frame, 0, 18);
  const translateY = slideUp(frame, 0, 18, 48);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{opacity, transform: `translateY(${translateY}px)`}}>
        Product analytics that feels instant
      </div>
    </AbsoluteFill>
  );
};
```

```tsx
import {useCurrentFrame} from 'remotion';
import {fadeIn, slideUp} from '../utils/motion';

const words = ['Ship', 'brand-safe', 'motion', 'faster'];

export const StaggeredWords: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{display: 'flex', gap: 16, flexWrap: 'wrap'}}>
      {words.map((word, i) => {
        const delay = i * 6;
        return (
          <span
            key={word}
            style={{
              opacity: fadeIn(frame, delay, 14),
              transform: `translateY(${slideUp(frame, delay, 14, 18)}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
```

## Typography Rules

Typography is disproportionately important because many Remotion projects are text-led: headlines, UI labels, feature callouts, stats, captions, and CTAs.

Good on-screen type:

| Good practice | Why it works | Bad practice |
|---|---|---|
| One clear headline style | Creates immediate hierarchy | Three competing title styles in one scene |
| Strong contrast against background | Protects readability on mobile | Low-contrast gray text over gradients |
| Safe margins | Prevents edge collisions and crop issues | Text too close to frame edges |
| Controlled line length | Improves scan speed | Wide paragraphs stretched across the frame |
| Limited font weights | Feels intentional | Every line uses a different weight |
| Purposeful tracking | Adds polish to display type | Random letter spacing everywhere |
| Clean multi-line breaks | Reads like editorial design | Centered ragged stacks with awkward breaks |

Contrast targets from the source guide:

- standard text: at least `4.5:1`
- large text: at least `3:1`

## Typography Tokens And Font Loading

```ts
// src/constants/typography.ts
export const TYPOGRAPHY = {
  display: {
    family: '"Inter", sans-serif',
    size: 96,
    lineHeight: 1,
    letterSpacing: -3,
    weight: 700,
  },
  headline: {
    family: '"Inter", sans-serif',
    size: 64,
    lineHeight: 1.05,
    letterSpacing: -1.5,
    weight: 700,
  },
  body: {
    family: '"Inter", sans-serif',
    size: 32,
    lineHeight: 1.25,
    letterSpacing: 0,
    weight: 500,
  },
  caption: {
    family: '"Inter", sans-serif',
    size: 22,
    lineHeight: 1.3,
    letterSpacing: 0,
    weight: 500,
  },
} as const;
```

```tsx
// src/fonts/load-fonts.ts
import {loadFont} from '@remotion/google-fonts/Inter';

export const {fontFamily} = loadFont('normal', {
  weights: ['500', '700'],
  subsets: ['latin'],
});
```

Centralize font loading. Decentralized font loading is a common source of render issues.

## Layout By Format

| Format | Layout bias | Best practice |
|---|---|---|
| 16:9 | Horizontal space is abundant | Use asymmetric layouts, side-by-side UI and text, wider grids |
| 9:16 | Vertical attention funnel | Stack content, enlarge focal text, keep primary action in center band |
| 1:1 | Balanced but constrained | Use centered or split-card layouts, avoid long paragraphs |

```tsx
type GridLayoutProps = {
  columns?: string;
  gap?: number;
  children: React.ReactNode;
};

export const GridLayout: React.FC<GridLayoutProps> = ({
  columns = '1fr 1fr',
  gap = 32,
  children,
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        gap,
        width: '100%',
        height: '100%',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
};
```

## SaaS And UI Motion Graphics

For SaaS videos, the biggest mistake is fake UI. If the interface looks stylish but functionally impossible, the result feels generic rather than product-specific.

A realistic SaaS UI scene usually includes:

- one focal interaction at a time
- believable cursor motion
- hover or press states with minimal overacting
- progressive chart or KPI reveals
- preserved screenshot aspect ratios
- card depth, spacing, and alignment that match actual product grammar

```tsx
import {interpolate, useCurrentFrame} from 'remotion';

export const Cursor: React.FC<{fromX: number; toX: number; fromY: number; toY: number}> = ({
  fromX,
  toX,
  fromY,
  toY,
}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 24], [fromX, toX], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const y = interpolate(frame, [0, 24], [fromY, toY], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pressScale = interpolate(frame, [24, 28, 32], [1, 0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${pressScale})`,
        width: 26,
        height: 26,
        borderRadius: 999,
        background: '#111',
      }}
    />
  );
};
```

Prompt for SaaS UI motion:

```md
Build a polished SaaS dashboard scene in Remotion.

Requirements:
- 16:9, 1920x1080, 30fps
- duration 180 frames
- one hero dashboard mockup with three metric cards and one chart
- realistic cursor motion and one click interaction
- card reveals should be staggered, not simultaneous
- no fake impossible UI geometry
- preserve strong spacing and alignment
- use reusable `DashboardCard`, `Cursor`, and `ChartReveal` components
- keep the scene clean enough for a product marketing homepage video
- output one scene file plus any shared reusable components
```

