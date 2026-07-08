---
source_import_id: "c400e9df-fa58-4dd9-bad2-8c17e6624502"
source_file: "bacariq_motion_graphics_remotion_rulebook.md"
source_section: "Materials-first rule, asset usage rules, audio sync, QA stills, contact sheets, documentation, and file naming"
title: "BacarIQ Materials, Audio, and QA Workflow"
summary: "BacarIQ Remotion implementation must audit local materials first, preserve approved assets, sync visuals to locked voiceover timing, and prove quality with style frames, QA stills, contact sheets, and implementation notes."
importance: 1
tags: ["bacariq", "assets", "qa"]
keywords: ["BacarIQ asset audit", "Remotion contact sheet QA", "locked voiceover sync"]
---

# BacarIQ Materials, Audio, and QA Workflow

BacarIQ Remotion work must be materials-first and evidence-driven. Do not assume assets are missing, do not replace approved logos with weak fallbacks, and do not accept a render just because it completes.

## Materials-First Audit

Before any implementation task, Codex must recursively inspect:

```text
../materials/
../materials/images/
../materials/images/common/
../materials/voice-effects/
../materials/background-music/
my work/
```

Search for:

```text
.png
.jpg
.jpeg
.webp
.svg
.mov
.mp4
.gif
.mogrt
.mp3
.wav
.m4a
.aac
```

Search by filename keywords and by visual or contact-sheet inspection.

Example search keywords:

```text
bacariq
logo
wordmark
chatgpt
openai
claude
anthropic
gemini
google
ai
model
arrow
cursor
lock
locked
prompt
file
folder
research
deep
workflow
screenshot
taskify
whoosh
swoosh
click
tap
select
notification
transition
rise
hit
ui
warning
red-x
```

Create an asset audit folder for each part:

```text
my work/remotion-output/partXX-vY-asset-audit/
```

It should contain:

```text
asset-index.md
asset-index.json
image-contact-sheet.png
logo-candidates-contact-sheet.png
sfx-candidates.md
```

The final implementation response must list:

- BacarIQ assets found and used
- ChatGPT/OpenAI assets found and used
- Claude/Anthropic assets found and used
- Gemini/Google assets found and used
- arrow/connector assets found and used
- lock/prompt/workflow assets found and used
- SFX/music assets found and used
- any fallback reason

Do not use plain monogram fallbacks for Claude or Gemini unless the asset audit proves that no approved local asset exists. Do not download assets from the internet unless explicitly approved.

## Asset Usage Rules

Use local approved materials where possible.

Rules:

- use `staticFile()` for local assets in Remotion
- use Remotion image and audio components
- preserve aspect ratios
- never stretch logos
- never crop logos
- never blur official logos
- do not invent missing asset paths
- if an asset is low quality, use a clean vector fallback and document why
- do not duplicate reusable assets into the project folder unless necessary
- prefer shared library paths for reusable assets
- create an asset map in code for each part

Example asset map:

```ts
export const part01Assets = {
  bacariqLogo: staticFile("..."),
  taskifyScreenshot: staticFile("..."),
  chatgptIcon: staticFile("..."),
  claudeIcon: staticFile("..."),
  geminiIcon: staticFile("..."),
  softWhoosh: staticFile("..."),
};
```

If a local asset is missing, represent that honestly:

```ts
export const part01Assets = {
  claudeIcon: null, // fallback documented in asset audit
};
```

## Audio And Sound Design

Voiceover is the main audio layer. Sound effects should support visible action only.

Use:

- soft whoosh for major transition
- subtle UI click/select for model card entrance
- typing ticks for prompt input
- warning tick for issue markers
- lock tick for locked cards
- final soft select or emphasis for the key question

Avoid:

- loud meme sounds
- too many whooshes
- warning beeps covering voice
- huge impacts for small UI motion
- constant background noise
- music that covers speech
- SFX attached to every tiny movement

Sound must follow:

```text
anticipation -> action/contact -> settle -> decay
```

If there is no meaningful visible action, do not add a sound.

Mix rules:

- voice must be clear
- SFX should be low volume
- music, if used, must be very quiet under narration
- use frame-based volume control
- use fewer, better sounds

## Voiceover Sync

The locked voiceover must not be edited. Use Remotion non-destructive audio offset or trim only.

For each part:

- read timing from `audio-timing-data.json`
- convert seconds to frames
- define beat frame constants
- align major visual changes to narration phrases
- do not let visuals lag behind speech
- avoid showing a visual before the narration makes it meaningful
- do not rush reading time

Example timing file:

```ts
export const PART02 = {
  fps: 60,
  startSeconds: 29.86,
  endSeconds: 55.0,
  startFrame: 1792,
  endFrame: 3300,
  beats: {
    weakPrompt: {start: 0, end: 360},
    outputDrift: {start: 320, end: 780},
    diagnosis: {start: 740, end: 1180},
    rehook: {start: 1140, end: 1500},
  },
};
```

Each major event must map to a voice cue.

## Style-Frame Gate

For each video part, Codex must generate style frames before final render.

Minimum style frames:

```text
style-frame-01-main-setup.png
style-frame-02-mid-beat.png
style-frame-03-main-proof-or-change.png
style-frame-04-final-state.png
```

A style frame passes only if:

- it is readable
- the main message is clear
- all important elements are inside safe area
- typography hierarchy is strong
- there are no overlaps
- icons and logos are not stretched
- composition feels premium
- the frame could be shown to a client as visual direction

If style frames are weak, do not render the video yet.

## QA Stills And Contact Sheets

Never accept a render just because it completed. Before final render, generate:

- four style frames
- a contact sheet
- key QA stills

For each part:

```text
qa-part-XX-vY-style-frame-01.png
qa-part-XX-vY-style-frame-02.png
qa-part-XX-vY-style-frame-03.png
qa-part-XX-vY-style-frame-04.png
qa-part-XX-vY-contact-sheet.png
```

The contact sheet must sample:

```text
start
early beat
mid beat
transition frames
late beat
final hold
```

Review frames for:

- blank first frame
- cropped text
- cropped cards
- logo stretching
- unreadable text
- arrow overlap
- clutter
- wrong reveal
- static dead sections
- mismatched voice timing
- too much empty space
- poor hierarchy
- transition ghosts
- SFX timing if possible

If any QA frame fails, fix before final render.

## Recommended Contact Sheet Timestamps

For an approximately 30-second part:

```text
0s
0.5s
1s
2s
3s
4s
5s
6s
8s
10s
12s
14s
16s
18s
20s
22s
24s
26s
28s
29s
```

For shorter parts, sample:

```text
start
start + 0.5s
25%
50%
75%
end - 1s
end
```

Include transition frames, not only stable beats. Most problems happen during transitions.

## Documentation Requirements

Every implementation must update:

```text
my work/storyboards/part-XX-.../implementation-notes.md
```

Include:

- timing used
- files changed
- assets used
- SFX/music used
- style frames generated
- contact sheet generated
- render output
- verification checklist
- limitations
- next step

Update `README.md` only when project status changes. Do not delete previous history unless it is clearly wrong.

## File Naming Standards

Use clear names:

```text
video-2-part-01-hook-16x9-60fps-v6.mp4
video-2-part-02-problem-16x9-60fps-v1.mp4
qa-part-02-v1-style-frame-01-weak-prompt.png
qa-part-02-v1-contact-sheet.png
part02-v1-asset-audit/
```

Avoid:

```text
final.mp4
new.mp4
test2.mp4
output.mp4
```

## Final Production Checklist

Before approving any BacarIQ Remotion part, verify story, visual design, motion, assets, audio, Remotion implementation, and QA.

Story:

- the part has one clear purpose
- it advances the video
- it does not repeat the same idea unnecessarily
- it creates curiosity or delivers a micro-reward

Visual:

- main subject is obvious
- text hierarchy is clear
- layout is clean
- safe areas are respected
- background is subordinate
- brand style is consistent

Motion:

- motion has purpose
- no random movement
- camera movement clarifies rather than distracts
- transitions are clean
- no dead static sections
- no chaotic movement

Assets:

- materials library was audited
- correct logos/icons are used
- no poor fallback appears without proof
- asset aspect ratios are preserved
- local assets are referenced correctly

Audio:

- voice is clear
- visual beats align with voice
- SFX are subtle
- no audio clutter exists
- original speech file is unchanged

Remotion:

- TypeScript is clean
- no giant components exist
- timing constants are centralized
- assets are centralized
- frame-based animation is used
- no CSS keyframe dependency controls core motion

QA:

- style frames were generated
- contact sheet was generated
- key frames were inspected
- no crop, overlap, or clutter remains
- render has correct resolution and FPS
- documentation was updated
