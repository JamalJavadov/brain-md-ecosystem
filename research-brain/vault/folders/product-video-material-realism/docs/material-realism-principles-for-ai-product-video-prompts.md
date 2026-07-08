---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Core Material Realism Principles"
title: "Material Realism Principles for AI Product Video Prompts"
summary: "Core prompting principles for making AI-generated product materials look tactile, premium, and physically legible instead of waxy, generic, or synthetic."
importance: 1
tags: ["ai-video", "material-realism", "product-prompts"]
keywords: ["physically legible material behaviour", "material realism prompts", "roughness micro detail", "premium product video"]
---

# Material Realism Principles for AI Product Video Prompts

The most reliable way to make materials in AI-generated product videos look expensive, tactile, and less obviously synthetic is to stop asking for "realism" in general. Prompt for physically legible material behaviour instead: surface type, finish, roughness, reflectance, micro-detail, edge condition, shadow behaviour, and camera treatment.

A clip can be made to look less obviously AI-generated to viewers, but Google-generated videos still include SynthID watermarking. The practical target is not removing every trace of AI. The target is removing the visual tells that make AI video look waxy, weightless, generic, or prompt-shaped.

## Why AI Materials Look Fake

AI materials usually fail for the same reasons weak CGI materials fail: the surface has shape but not enough material logic.

Common failures include:

- roughness that is too even across every surface;
- reflections that look generic rather than optically placed;
- edges that are too perfect;
- labels and print that behave like textures pasted onto geometry;
- weak grounding from under-specified contact shadows, perspective, and surface interaction.

The "plastic AI look" often comes from uniform roughness and over-clean shading. Prompts such as "luxury bottle, glossy surface" frequently fail because they collapse the surface into a vague style. More reliable prompts describe behaviour:

> clear lacquered carton with very smooth broad reflections on flat planes, slightly softer roughness on folded corners, tiny micro-scuffs near handled edges

## Separate Material Identity From Lighting Identity

Do not mix the surface itself with the light falling on it.

Material statement:

> warm kraft paper with visible long fibres and low sheen

Lighting statement:

> soft right-side strip light revealing fibres and gentle fold relief

Combining those two layers is more stable than vague style words such as "super realistic premium look." Describe the surface first, then describe how light interacts with it.

## Prompt Material as Behaviour, Not a Label

Useful material prompts borrow from physically based workflows. A good prompt does not merely say "metal watch" or "glass perfume bottle." It describes how the surface handles light.

Use this descriptor stack:

- **Material type:** glass, lacquered paperboard, anodised aluminium, matte polymer, coated paper, leather.
- **Surface state:** polished, brushed, uncoated, varnished, frosted, satin, oxidised, dusty, fingerprinted, lightly worn.
- **Roughness behaviour:** broad soft reflections, crisp specular streaks, uneven micro-roughness, matte body with glossy edges.
- **Micro-detail:** paper fibre, micro-scratches, brushed grain, moulded plastic texture, leather pores, print emboss, condensation droplets.
- **Edge condition:** slightly rounded bevels, worn corners, folded seams, crisp cut edges, compression marks.
- **Grounding:** contact shadow, surface reflection, weight on table, minute deformation or settling if relevant.

## Use Physically Plausible States

Avoid "anything goes" material combinations. Pure, unweathered surfaces are usually metallic or non-metallic, not halfway. Transitional states make sense when dirt, oxidation, coating, or wear partially obscures raw metal.

Weak wording:

> semi-metallic luxury cardboard

Stronger alternatives:

> coated paperboard with a glossy varnish

> painted aluminium with small exposed raw-metal wear on corners

The same rule applies to clear-coated and brushed materials. Watch cases, tech chamfers, and machined lids should usually include directionality:

> brushed stainless steel body with horizontal anisotropic grain, polished chamfer catching a sharp linear highlight

That is more faithful to real products than the generic phrase "shiny metal."

## Keep Material Continuity Shot to Shot

Consistency is a workflow problem, not only a wording problem. If label design, packaging folds, proportions, or finish matter, do not regenerate the object from scratch for every shot.

The cleanest material pipeline is usually:

1. Create or render a still or first frame that already looks materially correct.
2. Use that still as the first frame or subject image.
3. Animate from that frame with a motion-led prompt.
4. Reuse the same source assets or ingredient images across shots.

This keeps object identity, textures, and finish more stable than repeated text-only prompting.

## Final Rule

Premium material realism is not a style word. It is a chain of physical cues. Prompt the object as a real manufactured thing with a specific surface, a specific finish state, and a specific light response.
