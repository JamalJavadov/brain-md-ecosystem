---
source_import_id: "c400e9df-fa58-4dd9-bad2-8c17e6624502"
source_file: "bacariq_motion_graphics_remotion_rulebook.md"
source_section: "Reveal rules, Part 1 lessons learned, prompt structure, implementation templates, bug-fix template, rebuild criteria, prompting tone, and done-when examples"
title: "BacarIQ Codex Implementation Prompts and Rebuild Rules"
summary: "Reusable prompt structures and decision rules for asking Codex to implement, fix, or rebuild BacarIQ Remotion parts without repeating weak layouts, loose asset handling, or premature reveals."
importance: 1
tags: ["bacariq", "codex", "prompting"]
keywords: ["BacarIQ Codex prompt template", "Remotion rebuild criteria", "BacarIQ reveal rules"]
---

# BacarIQ Codex Implementation Prompts and Rebuild Rules

BacarIQ Remotion prompts must make Codex behave like a production implementer, asset auditor, audio-sync editor, and QA reviewer. Vague requests such as "make it better" or "make it dynamic" caused weak renders during Part 1.

## Reveal Rules For BacarIQ Video 2

For comparison videos with results or winners, do not reveal early:

- generated result videos
- final scores
- winner badge
- Gemini as winner
- final score table

Allowed early:

- blurred result placeholders
- locked cards
- source screenshot
- prompt file cards
- AI model cards
- empty scorecard
- workflow diagram

Final reveal order:

```text
ChatGPT result
Claude result
Gemini result
```

The winner badge appears only after the final comparison. Early parts should use locked or blurred visuals only.

## Lessons From Part 1

Part 1 went through many iterations and exposed repeated failure patterns.

### Failed Pattern 1 - Basic Implementation

Problem:

- technically rendered
- felt static
- transitions were weak
- scenes looked like separate slides
- materials were underused
- model cards were too simple

Correction:

- ask for asset audit
- ask for style frames
- use camera stage only if it improves continuity
- do not accept the first render

### Failed Pattern 2 - Too Much Camera Movement

Problem:

- 3D movement created cropping
- arrows overlapped elements
- cards went out of safe area
- layout became messy

Correction:

- prioritize clean readability
- use safe-area constants
- reduce camera extremes
- generate a contact sheet
- inspect transition frames

### Failed Pattern 3 - Too Much Patch Logic

Problem:

- Codex patched weak structures
- the basic card layout remained weak
- monogram fallbacks were used
- the material library was not deeply inspected

Correction:

- use a materials-first rebuild
- create asset contact sheets
- require a style-frame plan
- reject monogram fallbacks unless an audit proves no real assets exist

Future prompts should not say:

```text
Fix the current video.
```

They should say:

```text
Audit materials, create style frames, implement a professional scene from the storyboard, QA frame-by-frame, then render.
```

## Strong Codex Prompt Structure

Every strong implementation prompt should include:

```text
Role
Objective
Scope
Source files to read
Materials audit
Style-frame plan
Storyboard interpretation
Visual rules
Motion rules
Audio rules
Asset rules
Remotion architecture
QA requirements
Render output
Documentation update
Final response format
Do-not-do list
```

Bad:

```text
Make Part 2 professional and dynamic.
```

Better:

```text
Implement Part 2 only as a 2560x1440 60fps Remotion segment. Read the storyboard, visual board, audio timing, README, and AI materials. Audit the local materials library, create an asset index, produce four style frames, implement the Remotion scene using frame-based animation, generate contact sheet, render MP4, verify no reveal rules are broken, and update implementation notes.
```

## Universal Implementation Prompt Template

```md
You are a senior Remotion developer, motion graphics art director, UI motion designer, asset librarian, audio-sync editor, and frame-by-frame QA reviewer.

Your task is to create [PART NUMBER / TITLE] of [VIDEO PROJECT] as a professional Remotion video segment.

This is a real implementation + render task for [PART NUMBER] only.

Do not implement later parts.

## Main objective

Create a professional, clean, dynamic, educational 2D / 2.5D motion graphics video for [PART TITLE].

The part must communicate:
[CORE MESSAGE]

## Required output

Render:
[OUTPUT PATH]

Specs:
- 16:9
- 2560x1440
- 60 fps
- MP4 / H.264 + AAC
- language: Azerbaijani
- style: clean premium BacarIQ educational motion graphics

## Scope

Implement only:
[PART]

Do not reveal:
[REVEAL RESTRICTIONS]

## Locked audio

Use:
[AUDIO PATH]

Do not edit or replace it.

Use timing from:
[TIMING FILES]

## Required first phase - read project context

Read:
[README]
[STORYBOARD]
[VISUAL BOARD]
[BEAT MANIFEST]
[AUDIO TIMING]
[STYLE GUIDE]
[REMOTION BRIEF]
[CURRENT SRC]

## Required second phase - read AI production standards

Read:
../materials/ai materials/

Apply:
- professional motion design
- storyboard standards
- Codex/Remotion rules
- sound design rules
- color/hierarchy rules
- educational retention rules

## Required third phase - materials-first asset audit

Recursively inspect:
../materials/
my work/

Create:
[ASSET AUDIT FOLDER]

Include:
asset-index.md
asset-index.json
image-contact-sheet.png
sfx-candidates.md

Use real local assets when available.

Do not use fallbacks unless audit proves assets are missing or unusable.

## Required fourth phase - style-frame plan

Create:
[STYLE FRAME PLAN PATH]

Include:
- part purpose
- beat timing
- chosen visual concept
- selected assets
- motion/camera plan
- SFX plan
- components to create/reuse
- reveal restrictions
- QA criteria

## Beat structure

Use the storyboard and beat manifest as source of truth.

Implement these beats:
[BEAT 1]
[BEAT 2]
[BEAT 3]
[BEAT 4]

## Visual design rules

- clean BacarIQ light background
- soft grid / soft gradient
- white cards
- rounded corners
- subtle shadows
- readable Azerbaijani text
- controlled accent colors
- one main focal point per beat

Avoid:
- clutter
- random particles
- excessive 3D
- unreadable text
- edge overflow
- fake UI chaos

## Motion rules

Use:
- frame-based animation
- easing
- subtle parallax
- staggered reveals
- connector line draw
- soft spring settle
- camera movement only where useful

Avoid:
- CSS keyframes
- huge camera swings
- random floating
- arrows covering text
- static holds without micro motion

## Audio rules

Voiceover is primary.

Use subtle SFX only for visible meaningful actions.

Document all SFX/music.

## Code architecture

Create/update:
[FILES]

Keep components modular.

Use TypeScript.

Use constants for:
- timing
- colors
- spacing
- safe area
- card sizes
- motion durations

## QA

Generate:
[STYLE FRAMES]
[CONTACT SHEET]

Do not final render until style frames look good.

## Render

Render:
[OUTPUT PATH]

## Documentation

Update:
[IMPLEMENTATION NOTES]

Update README only if appropriate.

## Verification checklist

Verify:
- render exists
- correct resolution
- 60 fps
- audio exists
- original WAV unchanged
- timing source used
- materials audited
- style frames generated
- contact sheet generated
- no crop
- no clutter
- no reveal rule broken
- typecheck/build/render pass
- no later parts implemented

## Final response format

Use:
[REQUIRED FINAL RESPONSE FORMAT]

Do not ask clarification questions. Use the project files as source of truth.
```

## Storyboard-To-Implementation Beat Template

For each beat, specify:

```md
## Beat X - [Title]

Purpose:
[Why this beat exists]

Audio timing:
[start-end seconds / frames]

Main visual:
[What viewer sees]

On-screen text:
[Exact Azerbaijani text]

Layout:
[Where elements go]

Motion:
[Entrance, emphasis, exit]

Camera:
[Static / push / truck / settle]

Assets:
[Paths or audit requirements]

SFX:
[Specific sound cue]

Transition:
[How it enters/exits]

Negative:
[What must not happen]
```

If any beat lacks these fields, complete planning before implementation.

## Bug-Fix Prompt Template

When a render is bad, do not simply say "make it better."

```md
The current render is rejected.

Analyze:
[VIDEO PATH]

Generate contact sheet:
[TIMESTAMPS]

Compare against:
[STORYBOARD]
[VISUAL BOARD]
[STYLE GUIDE]
[QA RULES]

Confirmed problems:
1. [Problem]
2. [Problem]
3. [Problem]

Your task:
Create v[number] focused on fixing only these issues:
- [Fix 1]
- [Fix 2]
- [Fix 3]

Do not add new complexity.

Clean readability first.
Collision-free layout second.
Motion third.

Before final render:
- generate QA stills
- generate contact sheet
- inspect all frames
- verify no crop / overlap / reveal violation

Render:
[NEW OUTPUT PATH]

Update:
[IMPLEMENTATION NOTES]
```

If the old structure is weak, do not ask for a patch. Ask for a rebuild.

## When To Rebuild Instead Of Patch

Use rebuild if:

- 3 or more versions fail
- layout structure is fundamentally weak
- assets were not audited
- style frames are weak
- the scene feels like PowerPoint
- camera movement causes repeated issues
- important elements keep overlapping
- model, logo, or asset visuals are replaced with weak fallbacks
- there is no strong visual concept

Use patch only if:

- the structure is good
- only small timing or layout issues exist
- style frames are already approved
- the final render is close

## Prompting Tone

Codex should be treated like a professional assistant, not a creative mind reader.

Use direct language:

- "Read these files first."
- "Do not implement later parts."
- "Create an asset audit."
- "Generate style frames before final render."
- "If style frames are weak, fix before rendering."
- "Use actual local assets if present."
- "Do not use fallback without proof."
- "Verify using contact sheet."
- "Respond in this exact structure."

Avoid:

- "Make it better."
- "Make it professional."
- "Use nice motion."
- "Be dynamic."
- "Do whatever looks good."

Those are too vague.

## Strong Prompt Opening

```md
You are a senior Remotion developer, motion graphics art director, UI motion designer, asset librarian, audio-sync editor, and frame-by-frame QA reviewer.

Your task is to implement Part X only as a professional BacarIQ educational motion graphics segment.

This is not a planning-only task. It includes materials audit, style-frame generation, Remotion implementation, QA contact sheet, render, and documentation.

Do not implement later parts.
Do not edit the locked audio.
Do not reveal later results.
Do not use placeholder logos unless the materials audit proves no local asset exists.
```

## Strong Done When

```md
Done when:
- Part X composition exists.
- It uses real audio timing.
- It uses audited local assets.
- Four style frames are generated and look premium.
- Contact sheet is generated and inspected.
- No text/card/logo is cropped.
- No connector overlaps text.
- Motion is dynamic but readable.
- Original WAV is unchanged.
- Reveal rules are respected.
- Typecheck/build/render pass.
- Final MP4 exists at the specified path.
- Implementation notes are updated.
```

The quality target is not:

```text
Codex rendered an MP4.
```

The quality target is:

```text
A viewer can watch the part and immediately understand the message, enjoy the motion, trust the visual quality, and continue watching.
```
