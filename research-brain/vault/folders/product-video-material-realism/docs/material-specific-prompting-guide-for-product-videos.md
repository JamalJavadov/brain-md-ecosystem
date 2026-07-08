---
source_import_id: "0ddc16d4-c753-46db-bcf6-2f6811df937e"
source_file: "Material Realism for AI Product Video Prompts.md"
source_section: "Material-Specific Prompt Guide"
title: "Material-Specific Prompting Guide for Product Videos"
summary: "Prompt wording for paper, kraft packaging, glass, metal, matte plastic, fabric, leather, coffee packaging, and cosmetics materials in AI product videos."
importance: 1
tags: ["ai-video", "product-prompts", "materials"]
keywords: ["kraft paper prompt", "glass perfume bottle prompt", "brushed metal prompt", "matte plastic prompt"]
---

# Material-Specific Prompting Guide for Product Videos

Material prompts work best when they name the surface, finish, roughness behaviour, micro-detail, edge condition, and lighting response. The examples below are reusable wording patterns for common commercial product materials.

## Paper, Books, Flyers, and Booklets

Paper reads as premium when the prompt distinguishes between coated and uncoated stock, thickness, grain or fibre visibility, print finish, and edge quality.

Coated stock wants:

- clean broad reflections;
- crisp print edges;
- controlled studio light;
- visible paper thickness where relevant.

Uncoated stock wants:

- shallow grazing light;
- soft fold shadows;
- visible paper grain;
- natural ink behaviour.

Use:

```md
Thick uncoated print paper with visible fine fibre texture, crisp die-cut edges, subtle emboss on the logotype, shallow side light revealing paper grain, soft contact shadow on white tabletop.
```

Avoid using only:

```md
high-quality brochure
```

## Kraft Packaging, Cardboard, Boxes, and Paper Bags

Kraft materials often look fake when prompted as simple "brown paper." The model may default to flat beige plasticised surfaces.

Specify:

- warm natural kraft tone;
- matte low sheen;
- visible cellulose fibres;
- fold compression;
- slight edge darkening;
- real seam geometry;
- print ink absorption when relevant.

Dependable phrase:

```md
Natural uncoated kraft paperboard, warm beige-brown, visible long fibres, slightly compressed folded seams, soft low-sheen surface, gentle side light revealing paper texture without making it glossy.
```

## Glass, Perfume Bottles, and Cosmetics

Glass realism depends on edge definition, refraction, transparency control, and reflection shape. Prompt for clean edge light and controlled strip reflections, not glowing glass.

For clear glass:

```md
Clear thick-walled glass bottle, sharp refraction at the base edges, clean vertical softbox reflections, faint internal liquid meniscus, polished cap with restrained highlight, transparent glass without haze, no magical sparkles.
```

For frosted glass:

```md
Frosted glass body with softened transmission and diffused surface bloom.
```

Do not replace these cues with vague wording such as:

```md
soft luxury bottle
```

## Metal, Watches, and Tech Products

Metals look convincing when prompted with state, grain direction, polish contrast, and coating.

Useful material states:

- brushed titanium;
- anodised aluminium;
- oxidised copper;
- lacquered brass;
- bead-blasted steel;
- polished chamfer;
- exposed raw-metal wear on corners.

For watches and tech products, prompt material zones separately:

```md
Brushed steel case with horizontal anisotropy, mirror-polished bevel catching a thin sharp highlight, sapphire crystal with soft rectangular reflection, bead-blasted crown texture, matte black dial with fine concentric grain.
```

This prevents the model from collapsing the product into generic chrome.

## Matte Plastic

Matte plastic becomes obviously AI-generated when it is too smooth, too textureless, or uniformly dead. Add subtle micro-texture and gradual highlight roll-off.

Useful phrases:

- fine sandblasted ABS surface;
- subtle injection-mould texture;
- soft broad highlight across the curve;
- slightly brighter rubbed edges;
- matte polymer micro-texture.

Use these instead of only:

```md
matte plastic body
```

## Fabric, Leather, and Soft Materials

Texture is the main material story. Name the weave, nap, pore size, stitch relief, or crease behaviour.

Useful phrases:

- tight woven canvas;
- fine pebbled leather;
- soft suede nap;
- subtle stitch relief;
- creased fold memory;
- leather pores visible under side light.

Side light or harder directional light can reveal these textures when used deliberately.

## Coffee Packaging and Cafe Products

Coffee products often need two material stories at once: the package material and the food or drink environment.

For coffee bags, include:

- matte printed bag surface;
- one-way valve;
- fold geometry;
- slight crumple memory;
- realistic print finish;
- subtle creases near the seal.

For cups, beans, or drinks, include visible details only when they are actually present:

- steam drift;
- ceramic glaze;
- crema texture;
- bean oil sheen.

Example:

```md
Matte printed coffee bag with visible fold memory, subtle creases near the seal, realistic print finish, one-way valve detail, soft warm side light, gentle practical ambience, controlled highlight on edges, grounded contact shadow.
```
