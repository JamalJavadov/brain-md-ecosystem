---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Final Material Realism Checklist"
title: "Material Realism Review Checklist for Product Video"
summary: "Approval checklist for reviewing Google Flow, Gemini Omni, or Veo product clips for product continuity, material legibility, lighting quality, and AI-tell suppression."
importance: 1
tags: ["ai-video", "review-checklist", "product-quality"]
keywords: ["material realism checklist", "AI product video review", "product identity continuity", "AI tell suppression"]
---

# Material Realism Review Checklist for Product Video

Use this checklist before approving any Google Flow, Gemini Omni, or Veo product clip for delivery.

## Product Identity and Continuity

- Product proportions stay consistent across the shot.
- Label placement, typography, cap geometry, seams, and silhouette stay stable.
- If there are multiple shots, the object finish, colour, and texture remain stable between them.
- A first frame, subject image, or ingredient image has been used whenever the object design is not negotiable.
- The animation prompt is motion-led rather than a full re-description of an already-correct reference frame.

## Material Legibility

- The material can be named accurately from the image: coated paper, uncoated kraft, brushed steel, frosted glass, matte polymer, pebbled leather.
- Roughness is not uniform; different zones behave differently where appropriate.
- Micro-detail is visible where it should matter: fibre, grain, pores, scratches, emboss, print relief, or machining lines.
- Edges look manufactured, not procedurally perfect: slight bevels, fold compression, cut thickness, or polished chamfers are visible when relevant.

## Lighting and Camera

- Lighting direction has a clear purpose and helps reveal the material rather than flatten it.
- Reflections are controlled and intentionally shaped, especially on glass and metal.
- The camera move is simple enough that the material remains readable throughout the shot.
- Depth of field supports attention rather than hiding product detail.
- Contact shadows or surface reflections ground the product believably.

## AI-Tell Suppression

- There is no random glow.
- There is no excessive bloom.
- There are no repeated texture patterns.
- Label text is not warped.
- Highlights do not flicker or crawl unnaturally.
- The product does not float above the surface.
- Negative constraints are concise, placed near the end, and describe concrete failure modes.

## Final Approval Rules

Premium material realism is not a style word. It is a chain of physical cues.

Before delivery, confirm that the clip:

- treats the product as a real manufactured object;
- gives it a specific surface and finish state;
- gives light a specific interaction with that surface;
- uses reference-led workflows whenever product identity matters;
- keeps the camera and lighting simple enough to preserve detail;
- makes the first frame materially correct before animation;
- ends prompts with concise restrictions for the failure modes that actually matter.

If a clip must survive close inspection by a client, do not rely on text-only prompting when packaging shape, label typography, or material finish is mission-critical. Use a locked reference image, then animate from that image with motion-only instructions.
