---
source_import_id: "55cd1458-1872-4e0a-b26f-57d6e0d0f2f5"
source_file: "Professional Storyboard Guide for AI Motion Graphics Video Production.md"
source_section: "Storyboard Vocabulary and the Anatomy of a Professional Frame"
title: "Storyboard Vocabulary and Frame Anatomy"
summary: "Defines the key pre-production terms and the fields a professional storyboard frame should include for AI motion-graphics work."
importance: 1
tags: ["storyboarding", "pre-production"]
keywords: ["storyboard anatomy", "motion graphics frame fields", "ai reference frame"]
---

# Storyboard Vocabulary and Frame Anatomy

Professional storyboarding uses several related artifacts. They should not be treated as interchangeable because each one solves a different production problem.

## Core Terms

| Term | What it does | Best use in an AI motion-graphics workflow |
|---|---|---|
| Mood board | Defines emotional and visual direction | Lock palette, texture, typography references, icon style |
| Style frame | Shows a polished still of the intended final look | Lock art direction before animation or prompting |
| Storyboard | Sequences the piece shot by shot | Define composition, motion, text, camera, transitions |
| Shot list | Operational list of shots or setups | Track render order, edits, re-generations, and approvals |
| Animatic | Times storyboard panels as a rough video | Test pacing, reading time, transitions, and voiceover timing |
| Keyframe | Marks a key state in time | Specify crucial motion states within a shot |
| Reference frame | Anchors a shot's composition or continuity | Control start frame, end frame, or visual consistency for AI generation |

## Professional Frame Fields

A professional storyboard frame should include more than a drawing. For AI video use, a strong frame should contain the following fields, even when some are brief:

| Field | Why it matters |
|---|---|
| Scene number and frame number | Keeps approvals, prompts, and revisions aligned |
| Shot description | States what the viewer must understand immediately |
| Main subject and background | Prevents ambiguous focus |
| Composition note | Explains framing, focal point, and negative space |
| On-screen text | Locks copy length and layout impact |
| Typography note | Captures hierarchy, weight, alignment, emphasis |
| Camera angle and movement | Prevents generic or drifting AI camera behavior |
| Object or UI motion | Tells the model what should move inside the frame |
| Transition in and out | Preserves continuity between shots |
| Duration | Controls pacing and reading time |
| Voiceover or narration | Aligns text, motion beats, and edit timing |
| Sound cue | Helps motion rhythm and editorial intent |
| Visual references | Ties the shot to approved style |
| AI prompt note | Converts the board into a generation-ready instruction |
| Negative prompt note | Flags what must not happen |

## What Must Be Clear In Each Frame

Each frame should make these items obvious:

| Must be clear | Reason |
|---|---|
| Primary subject | So the model knows what to preserve |
| Camera angle | So generation does not default to generic framing |
| Exact text zone | So overlays do not drift or collide with UI |
| Major motion direction | So movement feels intentional |
| Dominant lighting idea | So the shot keeps a stable look |
| First/last frame relationship | So transitions can be generated or edited cleanly |

## What Should Be Simplified

The frame should also remove avoidable ambiguity:

| Simplify | Reason |
|---|---|
| Background clutter | Ambiguity increases hallucination risk |
| Tiny decorative copy | AI often renders small text poorly or inconsistently |
| Redundant style notes | If the reference frame already shows them, extra prompt text can confuse the model |
| Multi-action scenes | Short clips perform better with one focused moment |
| Unclear UI density | Dense fake interfaces tend to distort more easily |

## Frame Quality Rule

The frame does not need polished art, but it must communicate the idea, action, camera direction, timing, and constraints clearly. A rough frame with explicit production notes is more useful than a beautiful sketch that leaves motion, text, and continuity unresolved.
