---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Common AI material mistake table"
title: "Common AI Product Material Failures and Fixes"
summary: "A diagnostic table of common AI product-material failures, why they happen, how they look, and how to prevent or fix them."
importance: 1
tags: ["ai-video", "quality-control", "material-failures"]
keywords: ["plastic AI look", "uniform gloss", "floating object look", "random highlight flicker"]
---

# Common AI Product Material Failures and Fixes

Use this as a diagnostic reference when AI-generated product videos look waxy, weightless, over-glossy, or inconsistent.

| Mistake | Why it happens | How it looks | How to prevent it in the prompt | How to fix it in post |
|---|---|---|---|---|
| Generic "realistic" wording | The prompt gives mood but not material behaviour. | Surfaces look smooth, vague, and interchangeable. | Specify material type, finish, roughness, micro-detail, and reflection shape. | Add contrast selectively, sharpen texture areas, re-render from a stronger first frame. |
| Uniform gloss | Roughness is under-specified. | Bottle, paper, and plastic all look equally shiny. | Describe where reflections are crisp, broad, soft, or absent. | Reduce highlights and bloom; mask different surface zones differently. |
| Wrong metal behaviour | "Metallic" is used as a style word instead of a material state. | Grey chrome everywhere, weak separation between coated and raw metal. | State brushed, polished, anodised, or oxidised behaviour and describe anisotropy or coating. | Add directional highlights and tone down impossible chrome. |
| Glass without edge logic | Prompt asks for "transparent glass" but not refraction or highlight behaviour. | The bottle reads as invisible or glowy plastic. | Prompt for edge refraction, strip reflections, meniscus, and clean rim light. | Increase local contrast at edges; reduce haze and fake glow. |
| Flat paper and cardboard | Lighting is too frontal or too diffuse. | Packaging looks printed onto flat planes. | Use grazing light; mention fibres, folds, thickness, and soft contact shadows. | Recover midtone contrast and local texture; avoid crushing whites. |
| Product redesign between shots | Each prompt regenerates the product instead of animating a reference. | Labels move, proportions drift, finish changes. | Use subject images, first-frame workflows, and motion-only prompts. | Cut around the strongest shot; stabilise colour and geometry if possible. |
| Over-reliance on negative "no/don't" language | The model receives vague prohibitions instead of clear target visuals. | Results become unstable or contradictory. | Build a strong positive prompt, then end with short restriction terms. | Replace only the most distracting artifacts rather than global overcorrection. |
| Floating object look | Missing contact light and grounding cues. | Product feels weightless and composited. | Specify contact shadow, surface reflection, and table interaction. | Add or strengthen grounded shadow and subtle reflection. |
| Random highlight flicker | Too much simultaneous motion or weak reference locking. | Reflections jump or crawl unnaturally across frames. | Use stable studio lighting language and simplify motion to one dominant event. | Re-time, cut earlier, or regenerate from a cleaner first frame. |
| Excessive bloom and sparkle | "Cinematic" is translated into effects instead of optics. | Luxury products look cheap and synthetic. | Ask for restrained post-processing and controlled reflections instead. | Lower bloom, reduce halation, recover highlight detail. |

## Highest-Value Prevention Rules

For most product clips, the strongest prevention steps are:

- replace vague realism words with material behaviour;
- separate material description from lighting description;
- use a locked reference image when design continuity matters;
- prompt image-to-video clips for motion only;
- use one dominant camera event and one dominant lighting event;
- end with concise failure-mode restrictions.

## Useful Restriction Line

```md
Negative constraints: label distortion, warped geometry, floating object, random glow, plastic-looking sheen, over-sharpened reflections, inconsistent texture, muddy shadows, duplicated details, text artefacts.
```
