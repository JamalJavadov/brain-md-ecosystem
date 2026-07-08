---
source_import_id: "f5ee1d4a-1b1e-40d4-8e10-f8051b94679f"
source_file: "AI_vs_Professional_3D_Motion_Visuals_Research.md"
source_section: "Prompt engineering and anti-cliche patterns"
title: "Prompt Engineering and Anti-Cliche Patterns for AI Video"
summary: "Prompting rules and before/after examples for turning generic AI-looking product, logo, print, packaging, reel, and service-video prompts into controlled studio-style instructions."
importance: 1
tags: ["prompt-engineering", "ai-video", "commercial-video"]
keywords: ["AI video prompts", "anti-cliche prompting", "image-to-video motion", "studio-style prompt examples"]
---

# Prompt Engineering and Anti-Cliche Patterns for AI Video

Better AI video results come from explicit control of subject, action, environment, lighting, style, framing, and camera motion. Vague premium words create generic output. Specific physical and directorial instructions create controllable output.

## Five Prompt Rules

### 1. Separate Look From Motion

If a still frame is already strong, use image-to-video or referenced prompting and describe only the change over time.

Do not redescribe the entire frame unless the tool requires it. Focus on:

- camera movement;
- product movement;
- light movement;
- timing;
- what must remain locked;
- what must not change.

### 2. Describe the Shot Like a Director

Weak:

```text
Luxury orange logo animation.
```

Stronger:

```text
Tight 85mm hero shot, matte ceramic emblem with brushed copper bevel,
warm key light from upper left, slow 20cm push-in,
contact shadow on smoked acrylic plinth.
```

The stronger version defines optics, material, space, and movement.

### 3. Constrain Material Vocabulary

Do not ask for "futuristic premium" unless the prompt states what that means physically.

Use material terms such as:

- anodised aluminium;
- frosted acrylic;
- coated paper stock;
- smoked glass;
- bead-blasted steel;
- moulded polymer;
- offset-printed card;
- brushed copper;
- matte ceramic.

Surface appearance is driven by physical properties, not by luxury adjectives alone.

### 4. Keep AI Away From Final Brand Text and Logos

Use generative systems to move and light branded assets, not to redesign them.

For important logo or text work:

- use a locked reference asset;
- ask for camera, light, and reveal motion around the asset;
- composite final text manually;
- avoid letting the model invent letterforms;
- use letter-by-letter care only when text must be generated.

### 5. Ban Cliches at the Prompt Level

If a word regularly produces generic output, stop using it.

The easiest way to reduce the "AI feel" is to remove cue words that summon default AI premium aesthetics.

## Ban and Replace List

| Ban this cliche | Why it feels artificial | Replace with this |
|---|---|---|
| "floating premium panels" | Arbitrary forms with no product logic. | "acrylic information plaques mounted on a smoked-glass stand, each panel revealing one service" |
| "glowing luxury gradient" | Reads as a filter, not lighting. | "warm tungsten key with cool ambient fill and controlled falloff over textured backdrop" |
| "chrome everything" | Removes material hierarchy. | "one hero metal, one supporting neutral, one accent finish" |
| "sparkles / glitter accents" | Generic AI shorthand for quality. | "micro-specular highlights driven by roughness and edge curvature" |
| "cinematic blur everywhere" | Hides weak composition. | "shallow depth of field only on close macro proof shots; otherwise keep service text readable" |
| "logo morphing creatively" | Distorts brand equity. | "camera, light, and sectional reveal animate around a locked master logo asset" |
| "futuristic minimal background" | Too broad to be ownable. | "charcoal cyclorama with copper rim reflection and faint paper-stock texture" |
| "beautiful luxury ad" | No shot logic. | "9:16 service reel; 3-shot structure; hook, proof, sign-off; 6 seconds total" |

## Prompt Examples

### 3D Product Animation

```text
Weak:
Luxury product animation, futuristic, glowing, shiny, premium, cinematic.

Improved:
Create a 7-second product hero film for a premium cosmetic bottle.
Shot 1: macro 100mm close-up of embossed cap edge, brushed champagne aluminium,
fine micro-scratches, soft area-light highlight travelling left to right.
Shot 2: controlled 35mm half-orbit around the full bottle on a matte stone plinth,
contact shadow visible, background dark taupe cyclorama.
Shot 3: locked frontal hero frame, logo facing camera, subtle lens breathing,
no random particles, no extra objects.
Lighting: warm key from upper left, large soft fill from front, dim rim from rear right.
Materials: frosted glass body, anodised metal cap, paper label with slight fibre texture.
Motion: slow, deliberate, confident; no drift, no morphing.
```

### Logo Animation

```text
Weak:
Animate the ARTIZ.AZ logo in a cool luxury way.

Improved:
Animate a locked ARTIZ.AZ master logo as a physical object, not a redesign.
Build the logo as matte charcoal lettering with a brushed copper hero "A".
Camera: slow 50mm push-in from medium shot to close hero frame.
Action: a narrow band of light reveals the bevels, then the logo settles
on a smoked acrylic base with visible contact shadow.
Environment: dark studio, soft haze only in depth, not around the logo.
Constraints: do not distort letterforms, do not invent extra typography,
do not add sparkles.
```

### Flyer and Printing Business Video

```text
Weak:
Premium flyer ad with floating papers and luxury effects.

Improved:
Create a 9:16 print-services reel for a professional print house.
Visual concept: paper craftsmanship and colour accuracy.
Show three deliberate proof moments:
1) top-down layout grid with stacked flyer variants aligned precisely,
2) macro close-up of paper grain, foil stamp, and trim edge,
3) final neatly arranged business set on a real desk surface.
Typography will be added in post; leave clean negative space on the right third.
Lighting: daylight-balanced softbox key, subtle shadow direction,
realistic paper reflections only.
Motion: slide, align, stack, press, reveal; no floating pages without support.
```

### Packaging Business Video

```text
Weak:
Luxury packaging render, gold, floating boxes, beautiful.

Improved:
Create a commercial packaging showcase centred on structural design.
Hero objects: rigid box, sleeve, insert tray, label sticker.
Every motion must explain assembly or material quality:
sleeve slides off, lid lifts with realistic friction, insert reveals product cavity.
Camera: orthographic detail views for structure, then 3/4 hero frame for final packshot.
Materials: uncoated paperboard, spot UV label, foil accent, soft-touch laminate.
Lighting: controlled studio setup with broad highlights that describe edges and surface finish.
```

### Premium Instagram Reel

```text
Weak:
Make an aesthetic reel for our agency.

Improved:
Create a 6-second 9:16 ARTIZ.AZ service reel with one clear message:
premium 3D product videos for brands.
Structure:
0.0-1.2s hook: bold hero object enters frame with one service word.
1.2-4.5s proof: two fast but readable examples of material, lighting, and motion precision.
4.5-6.0s sign-off: locked ARTIZ.AZ logo on branded stage.
Safe framing: keep all critical content within centre-safe vertical boundaries.
Tone: confident, minimal, tactile, no meme pacing.
```

### Service Presentation Video

```text
Weak:
Show our services in a modern futuristic way.

Improved:
Create a 15-second service presentation film for ARTIZ.AZ.
Narrative: from brand problem to visual solution.
Use three service modules only: product animation, logo motion, commercial reels.
Represent each module with a distinct but brand-consistent surface:
smoked acrylic for product, brushed copper emblem for logo,
matte paper/poster surfaces for print and reels.
Camera language: one master movement vocabulary across all shots:
slow dolly, controlled pan, precise top-down reveal.
Typography: placeholders only; final copy to be composited manually.
End on a strong brand sign-off with enough clean space for CTA.
```
