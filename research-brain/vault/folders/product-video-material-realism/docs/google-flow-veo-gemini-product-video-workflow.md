---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Google Flow, Gemini Omni, and Veo Workflow"
title: "Google Flow, Veo, and Gemini Workflow for Product Material Realism"
summary: "Reference-led Google Flow, Veo, and Gemini Omni workflow for preserving product identity, material continuity, and realistic motion in AI product videos."
importance: 1
tags: ["google-flow", "veo", "ai-video-workflow"]
keywords: ["motion-only image-to-video prompt", "Veo 3.1 product workflow", "reference image product consistency", "Gemini Omni editing"]
---

# Google Flow, Veo, and Gemini Workflow for Product Material Realism

As of June 2026, the relevant Google workflow for product material realism combines Google Flow as the creative environment, Veo 3.1 as the high-fidelity video model, and Gemini Omni for conversational multimodal creation and editing.

The practical goal is to avoid repeatedly regenerating the product. For premium product work, create a materially correct source frame, then animate it with controlled motion.

## What the Google Stack Is Good At

The source describes this current stack as follows:

- **Google Flow:** AI creative studio for making and refining images and videos with Veo and Gemini Omni, including iterative natural-language editing, reference-driven creation, camera controls, and scene-building.
- **Veo 3.1:** high-fidelity video model for realism, prompt adherence, reference-image guidance, native audio, portrait video, first-frame workflows, and first/last-frame workflows.
- **Gemini Omni:** conversational multimodal layer that can take text, image, audio, and video inputs and edit through conversation while helping preserve physics and continuity across edits.

Veo 3.1 supports 16:9 and 9:16 video, first-frame and first/last-frame workflows, and up to three reference images.

## Best Material-Realism Workflow

Use this workflow when product identity, label placement, packaging shape, or material finish matters:

1. Create or render a high-quality still that already shows correct materials.
2. Use that still as the first frame or as a subject image.
3. Prompt primarily for motion, camera, and environmental animation.
4. Reuse the same source assets or ingredient images across shots to preserve object identity, textures, and finish.

This is more reliable than text-only prompting when packaging shape, label typography, or material finish is mission-critical.

## Use Reference Images to Lock Product Design

Google's reference-image workflow is the right tool for consistency. If label design, bottle proportions, packaging folds, or material finish matter, use reference images rather than relying on text alone.

When using image-to-video, the source emphasizes a clear rule from Google's guidance:

> prompt for motion only

The source image already carries subject, scene, and style. Re-describing those details can reduce quality or confuse the model.

Good image-to-video animation prompt:

```md
Slow dolly in, soft shift of reflections across the bottle shoulder, tiny dust motes in the air.
```

Weaker prompt if the source frame already shows the product:

```md
Luxury perfume bottle in a dark cinematic room with glossy glass, gold cap, expensive look.
```

## Prompt Structure for Safer Control

For material work, use this order:

```md
camera + framing -> product identity -> visible material behaviour -> motion -> light response -> scene context -> final restrictions
```

This order keeps the prompt focused on concrete product and material cues before mood or finishing language.

## Negative Constraints

Build a strong positive prompt first, then end with a short restriction line listing the concrete failure modes to avoid.

Useful final line:

```md
Negative constraints: label distortion, warped geometry, floating object, random glow, plastic-looking sheen, over-sharpened reflections, inconsistent texture, muddy shadows, duplicated details, text artefacts.
```

Avoid leaning on vague "no" or "don't" phrasing. Name the unwanted artifacts directly.

## Practical Production Note

If a clip must survive close client inspection, do not rely on text-only prompting when packaging shape, label typography, or material finish is mission-critical. Use a locked reference image, then animate from that image with motion-only instructions.
