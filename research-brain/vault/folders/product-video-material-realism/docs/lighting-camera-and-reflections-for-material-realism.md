---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Lighting and Camera for Material Realism"
title: "Lighting, Camera, and Reflections for Material Realism"
summary: "Practical lighting, reflection, and camera rules for revealing product material texture and reducing synthetic AI-video artifacts."
importance: 1
tags: ["ai-video", "product-lighting", "camera-prompts"]
keywords: ["controlled reflections", "product material lighting", "macro product prompt", "contact shadow grounding"]
---

# Lighting, Camera, and Reflections for Material Realism

Light reveals material more reliably than adjectives do. If the material matters, the light direction must have a job.

## Give the Light a Material Job

Different lighting setups reveal different material cues:

- **Side light and grazing light** reveal paper grain, embossing, leather pores, fabric weave, fold relief, and surface texture.
- **Diffused frontal light** reduces harsh shadows but can flatten tactile detail.
- **Backlight and rim light** help glass and transparent materials read clearly.
- **Controlled strip and softbox reflections** often look more premium on glossy metal and glass than broad, undefined glow.

Prompting rule:

> If the material matters, specify what the light reveals.

Examples:

> shallow side light revealing paper grain

> clean vertical strip reflection along the bottle shoulder

> rim light defining the thick glass base edge

## Use Controlled Reflections, Not Random Shine

In product photography, reflections are part of the design. They should have placement, shape, and purpose.

Useful reflection phrases:

- clean rectangular softbox reflection along the bottle shoulder;
- narrow vertical highlight on the cap edge;
- soft broad highlight rolling across the carton face;
- polished chamfer catching a thin sharp strip highlight;
- restrained rectangular reflection on sapphire crystal.

Avoid relying on random bloom, sparkles, or generic "cinematic glow." These often replace material logic with special-effect logic and make premium products look synthetic.

## Match Camera Movement to Material Readability

Useful camera choices for material prompts:

- **Macro close-ups:** paper grain, embossed print, brushed metal, leather pores, machining lines, paint texture.
- **Slow dolly-in:** gentle reflection travel across a surface to reveal finish quality.
- **Controlled arc or orbit:** shape and silhouette, especially bottles, watches, and sculpted packaging.
- **Shallow depth of field:** emphasis on one tactile detail, but not so shallow that labels, seams, or cap geometry become unreadable.
- **Rack focus:** attention transfer between material zones, such as bottle shoulder to logo emboss.

The camera should clarify material, not overpower it. If the surface is subtle, use one camera event and one lighting event. When camera movement and lighting movement both become complex, the model is more likely to smear detail or reinterpret the object.

## Ground the Product

A realistic product should feel like it has weight and surface interaction.

Prompt grounding cues explicitly:

- stable contact shadow;
- subtle tabletop reflection;
- weight on surface;
- soft bag deformation where it rests;
- realistic shadow density under folded packaging;
- surface reflection that matches the light direction.

Weak grounding produces the common "floating object" look, where the product feels composited into the scene.

## Practical Prompt Pattern

Use a compact sequence:

```md
[camera move], [material surface], [specific light direction], [specific reflection shape], [grounding cue], [final restrictions]
```

Example:

```md
Slow product-level dolly in, frosted glass body with softened transmission and clean rim definition, vertical strip reflections placed along the shoulder, soft contact shadow on dark stone, stable studio lighting. Negative constraints: random glow, floating object, melted reflections, cloudy glass.
```
