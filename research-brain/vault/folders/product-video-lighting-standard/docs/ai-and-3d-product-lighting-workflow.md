---
source_import_id: "4dbda99f-24bd-468c-ac2a-08b36d51b025"
source_file: "Professional Lighting Standard for Realistic 3D Product and AI Video.md"
source_section: "AI Video and 3D Production Workflows"
title: "AI and 3D Product Lighting Workflow"
summary: "Workflow rules for realistic CGI and AI product lighting, including motion continuity, Blender lighting practice, Flow and Veo prompting, vertical delivery, and post-production checks."
importance: 1
tags: ["ai-video", "3d-lighting", "product-video"]
keywords: ["Veo lighting prompt", "Google Flow lighting continuity", "Blender product lighting", "vertical product video lighting"]
---

# AI and 3D Product Lighting Workflow

Convincing CGI and AI product video still obeys studio logic. The shot needs a dominant source, a believable environment, shadows that agree with that source, material-specific reflection handling, and continuity across cuts.

## Realism Rules for CGI and AI Product Video

A realistic commercial product shot should describe one coherent lighting setup.

Avoid stacking incompatible mood phrases such as "cinematic", "neon", "soft daylight", "dark luxury", and "golden hour" in the same prompt unless the shot design actually supports them.

Common AI lighting giveaways:

- Random light shifts.
- Blown glows.
- Inconsistent shadow direction.
- Glossy surfaces reflecting impossible environments.
- Color drift between cuts.
- Highlight shapes that change without a visible cause.
- Sterile, mathematically perfect surfaces with no real studio behavior.

The right target is controlled realism: clean and polished materials that still obey believable optical behavior.

## AI Lighting Failure Diagnosis

| Mistake | Why it happens | How it looks | Prevent it in prompt | Fix it in post |
|---|---|---|---|---|
| Random light direction changes | No stable source logic or conflicting references | Highlights jump; shadows switch sides | Specify one dominant key direction and "stable studio lighting throughout the shot" | Match exposure and relight selectively; reject unstable takes |
| Excessive bloom or glow | "Cinematic" is overinterpreted as haze and glare | Edges smear; labels and embossing wash out | Ask for restrained highlights, crisp specular control, realistic lens response | Reduce glow, roll back highlights, recover local contrast |
| Flat frontal lighting | Prompt asks for "bright" without shape | Product loses depth and feels synthetic | Use side or 45-degree key, lower fill, controlled rim | Add selective contrast and edge shaping, but reshoot if severe |
| Impossible reflections | Environment is unspecified or internally contradictory | Glass and metal reflect nonsense | Use clean studio environment, strip reflections, controlled cards | Mask and tame reflections; often best solved at generation stage |
| White-on-white edge loss | Background and product are both pushed to pure white | Product disappears into the set | Ask for clean white background with preserved product edges and soft contact shadow | Recover edge contrast and local shadows |
| Black-on-black muddiness | Low-key mood without separation strategy | Product turns into a silhouette blob | Ask for controlled edge highlights and readable hero surfaces | Lift selective mids, isolate contours, add subtle rim |
| Color drift between cuts | Auto-style variation or changing WB logic | Whites and packaging shift shot to shot | Fix color temperature, brand-accurate color, consistent white balance | Shot-match with scopes, neutralize casts |
| Flicker or banding | Frame instability, compression, or synthetic light behavior | Pulsing lighting, gradient banding, unstable shadows | Ask for flicker-free stable lighting and smooth gradients | Denoise, deband, replace gradients, or discard |
| Sterile over-clean render | Everything is mathematically smooth and evenly lit | Looks like CGI even when technically clean | Ask for photoreal material response, controlled micro-variation, real studio lighting | Add restrained grain and contrast texture |

## Lighting with Camera Movement and Object Animation

Motion adds responsibility: the lighting must still explain the product while the camera or object moves.

For orbit shots:

- Highlights should travel predictably across reflective surfaces.
- Do not animate multiple light changes at once unless the shot specifically requires it.
- Use one dominant static reflection system and one controlled moving perspective.

For push-ins and macro shots:

- Refine lighting for the final framing.
- Macro magnifies dust, flare, reflection pollution, and surface inconsistency.
- Small cards, precise accents, controlled diffusion, and focus stacking may be needed.

For object animation:

- A rotating package should show edge highlights sliding along folds.
- An opening lid should reveal believable bounce and shadow on newly exposed surfaces.
- Floating objects should still show contact shadows or grounded reflections when they approach a surface.

Weight is sold by contact, not only by movement curves.

## Blender and 3D Lighting Practice

For product work, area lights should usually be the first choice because they behave like softboxes and reflection cards.

Use Blender light types this way:

- **Area lights:** default for product keys, packaging, beauty, and tabletop work.
- **Point lights:** accents, motivated practicals, and small local highlights.
- **Spot lights:** narrow accents and controlled beams.
- **Sun lights:** daylight-based scenes.
- **HDRI or environment light:** controlled reflection and ambient layer, not a lazy substitute for shaped key lighting.

Use AgX or a similarly well-managed color pipeline when available. The source notes that Blender documentation describes Filmic as superseded by AgX, with improved saturated-color handling and about 16.5 stops of dynamic range. This matters because clipped brand colors, especially saturated reds, oranges, and packaging inks, quickly make CGI look brittle and synthetic.

Eevee can be useful for look development and styleframes, but needs care around contact, reflections, and post effects:

- Use contact shadows where the product meets a surface.
- Keep bloom subtle enough that branding remains readable.
- Use reflection planes or equivalent controls for glossy tables, phone screens, acrylic bases, and planar reflectors.
- Ambient occlusion should support grounding; it should not replace plausible lighting.

Clay renders are a fast lighting test. They remove material distractions so hierarchy, edge readability, and shadow logic can be judged directly.

Cycles is the safer renderer for premium reflective material work when the shot depends on subtle glass refraction, clean metal gradients, contact realism, or complex product-ground interaction.

## Flow, Gemini Omni Flash, and Veo Lighting Prompts

Google's source guidance emphasizes specificity about subject, action, environment, lighting, and style. For product lighting, describe the prompt like a shot plan instead of a mood board.

Strong lighting prompt order:

1. Product.
2. Setting.
3. Key direction.
4. Softness.
5. Color temperature.
6. Reflection behavior.
7. Continuity instruction.

Example:

> photoreal perfume bottle on black acrylic, single large soft key from camera left, narrow strip rim from rear right, controlled reflections on glass, soft contact shadow, stable studio lighting throughout the shot

For continuity, use reference-driven workflows when available:

- Ingredients.
- Start frames.
- Saved frames.
- First-frame generation.
- First-plus-last-frame workflows where supported.
- Prompt-based edits in Flow with Omni Flash.

The source notes that Flow can continue refining for up to three conversational turns without losing prior edit context. Use those turns to refine one lighting variable at a time.

Use clean product references on plain or segmented backgrounds. Cluttered references can import unwanted bounce colors, extra pseudo-practicals, and incoherent shadow logic.

For Veo-style negative prompting, prefer descriptive unwanted terms rather than "no" or "don't" phrasing.

Good negative phrase list:

> random light shifts, exposure flicker, unstable highlights, neon spill, muddy shadows, blown white paper, plastic-looking reflections

Operational note from the source: Google Flow exports include an invisible SynthID watermark identifying the video as AI-generated. Lighting quality can improve studio realism, but it does not remove platform provenance.

## Vertical Social Delivery and Post-Production

Vertical product advertising should be lit for 9:16 first, not merely cropped later.

Keep the hero product, brightest highlight path, and most important branding inside the central safe region. Interface overlays on platforms such as Reels, Stories, and TikTok can cover top and bottom frame areas.

Mobile delivery punishes lighting extremes:

- Avoid enormous glowing gradients that band after compression.
- Avoid ultra-dark crushed backgrounds.
- Avoid aggressive specular clipping that looked acceptable on a desktop preview.
- Preserve color information when possible to reduce banding and protect highlight and shadow detail.

In post-production, use scopes:

- **Waveform:** catches clipped whites and buried blacks.
- **Vectorscope:** catches color drift in whites, kraft stock, and metallic neutrals.
- **Parade and histogram:** help evaluate exposure and color balance across shots.

Subtle bloom and light grain can help unify a sequence, but both must remain subordinate to material readability. Once glow competes with the product edge, it stops reading as photographic and starts reading as generated.
