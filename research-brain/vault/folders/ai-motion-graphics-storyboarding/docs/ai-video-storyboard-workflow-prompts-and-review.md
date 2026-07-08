---
source_import_id: "55cd1458-1872-4e0a-b26f-57d6e0d0f2f5"
source_file: "Professional Storyboard Guide for AI Motion Graphics Video Production.md"
source_section: "Designing Storyboards for Gemini Omni, Veo, and Other AI Video Tools; Workflow from Brief to Prompt; Templates, Example, and Final Review Standards"
title: "AI Video Storyboard Workflow, Prompts, and Review"
summary: "A production workflow for turning storyboards into Gemini/Veo prompt packets, with continuity rules, notation, templates, a SaaS example, and a pre-generation review checklist."
importance: 1
tags: ["ai-video", "prompting"]
keywords: ["storyboard to prompt", "veo storyboard workflow", "ai video review checklist"]
---

# AI Video Storyboard Workflow, Prompts, and Review

AI-ready storyboards should be organized for multi-clip production. In the workflow captured here, Gemini Omni can reference and combine images, videos, text, and audio, while Veo 3.1 supports text-to-video, image-to-video, reference asset images, extend-video workflows, and first-and-last-frame generation.

Plan around these Veo 3.1 constraints:

- 4-, 6-, and 8-second clips
- 9:16 and 16:9 aspect ratios
- 24 fps
- English prompt language
- up to four outputs per prompt
- no reference style images in Veo 3.1

Because short AI clips work best when focused, storyboards should break the piece into single-scene prompt packets instead of trying to force a full mini-commercial into one generation.

## Continuity Strip

For AI storyboarding, add a continuity strip to each scene packet:

- approved character or product reference
- approved UI reference
- approved palette and typography note
- previous scene's final frame
- next scene's target opening frame
- persistent negative constraints

Useful negative prompt notes include:

- no unreadable text
- no warped logos
- no fake extra buttons
- no extra fingers or hands
- no camera shake
- no glow bloom
- no background layout changes

Ambiguous prompting hurts output quality. Quotation marks can also cause unwanted text rendering inside the video; use a colon format instead for spoken lines.

## Style Stabilization Without Style Reference Images

Because this Veo 3.1 workflow does not support reference style images, style has to be stabilized through the storyboard itself:

- approved style frames
- repeated visual vocabulary
- character or product references
- lighting notes
- palette notes
- consistent wording across prompts

If style-image-driven output is required, use a workflow that supports style images rather than this Veo 3.1 setup.

## Production Workflow

| Step | What to do | Why it matters |
|---|---|---|
| Define objective | State audience, platform, CTA, success metric | Keeps boards strategic, not decorative |
| Write script | One message beat per scene | Prevents overloaded panels |
| Break script into scenes | Usually one scene per short AI clip | Matches short-clip generation behavior |
| Lock aspect ratio | 16:9, 9:16, 1:1, or 4:5 based on destination | Protects composition from later cropping |
| Build mood board and style frames | Lock visual language before sequencing | Stabilizes art direction |
| Create rough thumbnails | Solve order and rhythm quickly | Avoids polishing weak ideas |
| Add text and safe zones | See real reading and layout pressure | Prevents text failures later |
| Add motion and camera notes | Make intent producible | Prevents generic motion |
| Add transition notes | Protect scene continuity | Helps both AI and editor |
| Add prompt and negative notes | Convert each frame to generation-ready logic | Speeds production and revision |
| Generate test clips | Validate board assumptions | Reveals ambiguity early |
| Compare output to board | Check match, drift, artifacts, readability | Decides what to regenerate |
| Revise storyboards selectively | Fix upstream thinking, not only downstream outputs | Improves the whole project |
| Build animatic | Time panels with VO and music | Tests final pacing before scaling generation |

## Motion Graphics Notation

Storyboard arrows should be paired with written descriptions because the same arrow can otherwise mean camera movement, object travel, or text reveal.

| Notation | Meaning |
|---|---|
| Solid straight arrow | Object or text moves directionally |
| Hollow arrow on frame edge | Camera move |
| Curved arrow | Rotation or orbit |
| Dashed arrow | Secondary or subtle motion |
| Double arrow | Scale change or push-pull emphasis |
| Bracket + arrow | Text reveal range |
| Mask line + arrow | Wipe or mask reveal |
| Layer labels FG / MG / BG | Parallax depth planning |
| UI state A -> B | Hover, click, open, collapse, loaded state |

Keep the notation system consistent across the whole document so producers, editors, and AI operators interpret it the same way.

## Storyboard-To-Prompt Template

```md
Scene ID:
Objective:
Aspect ratio:
Duration target:

Visual description:
Main subject:
Background / environment:
On-screen text:
Typography note:
Camera angle:
Camera movement:
Subject motion:
Environmental motion:
Transition in:
Transition out:
Lighting:
Color palette:
Brand / UI references:
Audio direction:
Negative notes:

Prompt-ready version:
[A single clean paragraph that combines the approved visual description,
camera, motion, lighting, style, and audio notes for generation.]

Continuity references:
- Previous frame:
- Next frame:
- Same seed:
- Persistent character/product description:
```

For image-to-video scenes, use the prompt for motion, camera movement, and environmental change rather than redundantly describing what the source frame already shows. For voiced scenes, avoid quotation marks in the generation prompt if you do not want visible text rendered into the shot.

## Markdown Storyboard Templates

Basic production template:

```md
| Scene | Frame | Visual description | On-screen text | Camera | Motion | Transition | Duration | Audio | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1A |  |  |  |  |  |  |  |  |
```

Motion-graphics storyboard template:

```md
| Scene | Frame | Key visual | Text hierarchy | Text-safe zone | Shape/icon motion | Camera | Transition | Duration | VO/SFX | AI prompt note | Negative note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1A |  |  |  |  |  |  |  |  |  |  |
```

SaaS product-video template:

```md
| Scene | Frame | UI state | Cursor action | Product value shown | On-screen text | Camera | Motion | Transition | Duration | Audio | AI / continuity note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1A |  |  |  |  |  |  |  |  |  |  |
```

AI generation template:

```md
| Scene | First frame ref | Last frame ref | Subject consistency note | Prompt-ready description | Negative constraints | Seed | Output status |
|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |
```

Shot-by-shot prompt planning template:

```md
| Scene | Goal | Prompt | Reference assets | Style note | Camera note | Motion note | Pass/fail review |
|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |
```

## Fifteen-Second SaaS Motion-Graphics Example

| Scene | Duration | Visual description | On-screen text | Motion direction | Camera | Transition | Sound | AI prompt note | Negative note |
|---|---:|---|---|---|---|---|---|---|---|
| Hook | 2.0s | Dark dashboard background; one alert card expands in center-safe zone | `Approvals are slowing down` | Alert card scales from 92% to 100%; red indicator pulse only once | Static, slight push-in | Hard cut from black | Soft hit + low UI hum | One focused problem frame; clear center composition | No extra UI widgets, no flicker |
| Problem context | 2.5s | Same dashboard zoomed out; multiple cards stacked and messy | `Too many steps. Too many tools.` | Panels slide in from left and right; cursor hesitates over tabs | Slow dolly out | Match cut on panel position | Two soft whooshes | Show tool sprawl without unreadable text | No fake menus, no random scroll |
| Solution reveal | 2.5s | Clean branded interface replaces clutter | `One workspace for every approval` | Old panels wipe away; new dashboard resolves on beat | Static after quick wipe | Shape wipe | Bright UI chime | Use approved UI screenshot as reference image | No warped logo, no altered palette |
| Feature proof | 3.0s | Cursor clicks `Assign reviewer`; side drawer opens; chart updates | `Assign. Review. Approve.` | Cursor click, drawer slide, status chip changes to green | Locked UI-demo framing | Cut on click | Click + light whoosh | Use motion-only prompt if source frame already shows UI | No unreadable small labels |
| Outcome | 2.5s | KPI card grows; timer drops from 3d to 2h | `From days to hours` | Number tween, subtle card emphasis, brief confetti line burst | Static | Cut | Soft rise + tick | Keep metric large and centered | No extra numbers, no jitter |
| CTA | 2.5s | Branded end card with product name and button | `See it in action` | Button glow once, logo settle, hold clean | Static | Cut or logo-led end | Logo sting | Final frame should be export-clean for post | No distorted text, no breathing background |

## Pre-Generation Review Checklist

- [ ] The message of each scene is obvious in one sentence.
- [ ] The aspect ratio matches the intended platform.
- [ ] Safe zones are drawn on all vertical and social-first panels.
- [ ] Critical text sits inside the text-safe zone.
- [ ] Type hierarchy is visible: headline, supporting text, CTA.
- [ ] Read time is realistic for the amount of text shown.
- [ ] Camera angle is named, not implied.
- [ ] Camera movement is labeled and not left to interpretation.
- [ ] Internal object or UI motion is labeled separately from camera motion.
- [ ] Transition in and transition out are specified.
- [ ] Lighting intent is written when it affects style or depth.
- [ ] Brand colors, fonts, and icon style are consistent across frames.
- [ ] UI state changes are logically connected and product-accurate.
- [ ] Frame-to-frame continuity is explicit.
- [ ] The first and last key frames needed for AI generation are identified.
- [ ] Prompt notes are clear, specific, and single-scene.
- [ ] Negative notes identify the most likely failure modes.
- [ ] The board can be turned into an animatic without guessing missing timing.
- [ ] Reviewers can tell what should be generated in AI and what should be replaced in post.
- [ ] The board is understandable by someone other than the original artist.
