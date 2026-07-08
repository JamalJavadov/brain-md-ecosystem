---
source_import_id: "22308d17-e37d-49af-ac1b-efa143c6795c"
source_file: "Codex and Remotion Professional Research Guide.md"
source_section: "Data-driven motion graphics; Brand systems and assets; Audio and sound design"
title: "Remotion Data Assets And Audio"
summary: "How to build Remotion videos from structured data, protect brand tokens, load assets reliably, and align audio to frame-based motion."
importance: 1
tags: ["remotion", "data-driven-video", "audio"]
keywords: ["remotion input props", "remotion zod schema", "remotion audio sync"]
---

# Remotion Data Assets And Audio

Remotion is especially strong when a video should be generated from data rather than hand-authored each time. Input props, dynamic metadata, JSON-driven batch rendering, and Zod schemas are the foundation for personalized videos, product update videos, automated changelog videos, KPI reports, and templated social output.

## Data-Driven Pattern

```tsx
// src/data/schema.ts
import {z} from 'zod';

export const ReportSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.number(),
      suffix: z.string().default(''),
    }),
  ),
});

export type ReportProps = z.infer<typeof ReportSchema>;
```

```tsx
// src/compositions/ReportVideo.tsx
import {ReportProps} from '../data/schema';

export const ReportVideo: React.FC<ReportProps> = ({
  headline,
  subheadline,
  metrics,
}) => {
  return (
    <SceneWrapper>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
        <Title text={headline} />
        <Subtitle text={subheadline} />
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24}}>
          {metrics.map((metric) => (
            <AnimatedCard key={metric.label}>
              <div>{metric.label}</div>
              <AnimatedCounter from={0} to={metric.value} duration={45} suffix={metric.suffix} />
            </AnimatedCard>
          ))}
        </div>
      </div>
    </SceneWrapper>
  );
};
```

```tsx
// src/Root.tsx
import {Composition} from 'remotion';
import {ReportVideo} from './compositions/ReportVideo';
import {ReportSchema} from './data/schema';

export const Root: React.FC = () => {
  return (
    <Composition
      id="ReportVideo"
      component={ReportVideo}
      schema={ReportSchema}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={180}
      defaultProps={{
        headline: 'Quarterly growth up sharply',
        subheadline: 'Your top metrics in one shareable summary',
        metrics: [
          {label: 'ARR', value: 128, suffix: '%'},
          {label: 'Churn', value: 3, suffix: '%'},
          {label: 'NPS', value: 62, suffix: ''},
        ],
      }}
    />
  );
};
```

## Data-Driven Codex Prompt

```md
Create a data-driven Remotion system for generating report videos from JSON.

Requirements:
- Use TypeScript and Zod schema validation
- Support input props for headline, subheadline, metrics, brand colors, and aspect ratio
- Build reusable components for title, cards, counters, and CTA
- Keep business data in `src/data/`
- Keep visuals reusable and brand-safe
- Include one sample JSON payload and one render command using props
- Do not hardcode report content into scene files
```

## Brand Tokens And Assets

Use `public/` plus `staticFile()` for local assets. Use Remotion asset tags such as `<Img>`, `<Video>`, and `<Audio>` rather than native HTML tags so rendering waits for assets correctly.

Brand tokens replace raw values with named decisions.

```ts
// src/constants/brand.ts
export const BRAND = {
  colors: {
    bg: '#07111F',
    surface: '#0F1C2E',
    text: '#F6F8FB',
    textMuted: '#A8B3C7',
    primary: '#6EE7FF',
    accent: '#7C5CFF',
    success: '#3DDC97',
  },
  radius: {
    sm: 16,
    md: 20,
    lg: 28,
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 20,
    lg: 32,
    xl: 48,
    safeX: 80,
    safeY: 64,
  },
  shadows: {
    card: '0 20px 60px rgba(0, 0, 0, 0.28)',
  },
} as const;
```

Prompt Codex explicitly:

```md
Use only tokens from `src/constants/brand.ts`.
Do not invent colors, shadows, radii, spacing, or fonts.
```

## Audio Layers

| Audio layer | Role | Professional note |
|---|---|---|
| Voiceover | Narrative anchor | Lock scene timings to voice first |
| Music | Energy and pacing | Use beat markers, not constant random cuts |
| UI sounds | Interaction realism | Reserve for clicks, confirmations, panel shifts |
| Transition effects | Momentum | Use sparingly; repeated whooshes get cheap fast |
| Captions | Accessibility and retention | Style them as part of the brand system |

## Volume Ramp Example

```tsx
import {AbsoluteFill, Html5Audio, interpolate, staticFile} from 'remotion';

export const AudioFadeIn: React.FC = () => {
  return (
    <AbsoluteFill>
      <Html5Audio
        src={staticFile('audio/music-bed.mp3')}
        volume={(f) =>
          interpolate(f, [0, 30], [0, 0.5], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        }
      />
    </AbsoluteFill>
  );
};
```

## Audio-Aware Prompt

```md
Add audio-aware motion timing to this Remotion project.

Requirements:
- keep the current storyboard intact
- align major reveals to explicit beat markers or voiceover phrases
- add frame constants for audio cues
- fade music underneath voice using frame-based volume control
- use minimal UI sound effects only where interactions happen
- do not overuse whooshes
- include comments showing which frame range maps to which audio beat
```

For music-reactive visuals or voice waveforms, the source guide identifies `useAudioData()`, `visualizeAudio()`, and `visualizeAudioWaveform()` as relevant Remotion media utilities.

