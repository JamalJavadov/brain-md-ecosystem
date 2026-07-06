# Codex Research Brain - Project Brief

## 1. Project Purpose

Codex Research Brain is a local-first interface for managing large Markdown research files used with Codex.

The main goal is to prevent important `.md` research files from getting lost and to make them easy for Codex to discover, understand, and use during future work.

The system uses Codex CLI automatically as its local analysis engine. It also prepares well-structured, copyable English prompts that tell Codex exactly which local research files to inspect and how to use them during later tasks.

## 2. Core Idea

The app acts as a local research vault and prompt generator.

The user performs one action: import a Markdown file.

The system then:

- Deeply analyzes the entire source with Codex CLI.
- Distinguishes valuable knowledge from noise.
- Splits mixed-topic files into standalone knowledge documents.
- Gives each extracted document an English title and summary.
- Generates tags, keywords, an importance score, and source traceability.
- Reuses a suitable existing folder or creates a new folder.
- Writes the cleaned documents into the correct folders.
- Rebuilds folder indexes, folder prompts, the global index, and the global prompt.
- Preserves the untouched original source and an import manifest.

The app should help Codex spend fewer tokens by pointing it to the most relevant folders and files instead of asking it to inspect everything blindly.

## 3. Main Product Decision

The first version should be a local web app.

Recommended stack:

- Frontend: React + Vite
- Backend: Node.js + TypeScript
- Database: SQLite
- File storage: real Markdown files stored on disk
- Search: SQLite FTS5 for the first version

The app should run locally, most likely on `localhost`, while all uploaded files and generated prompt/index files are stored under the current project directory.

## 4. Codex CLI Decision

Codex CLI is integrated as the automatic knowledge-organization engine.

It runs locally in read-only analysis mode and returns a strict JSON plan. Codex does not directly modify the vault. The backend validates the plan and performs all filesystem and database changes itself.

Every automatic analysis must use the latest recommended Codex model with `high` reasoning effort. The current pinned default is `gpt-5.5`, and the backend must pass both the model and reasoning effort explicitly to `codex exec` so user-level CLI defaults cannot silently reduce analysis quality. The model remains configurable through `CODEX_MODEL` for future upgrades, while `CODEX_REASONING_EFFORT` defaults to `high`.

Codex is responsible for:

- Understanding the source deeply.
- Detecting multiple domains inside one file.
- Extracting only useful and supportable information.
- Removing duplicated, irrelevant, outdated, or low-value material.
- Producing clean standalone Markdown for each knowledge unit.
- Selecting an existing destination folder or proposing a new one.
- Producing English metadata for indexing and retrieval.

The application is responsible for:

- Archiving the original source.
- Validating and applying the plan.
- Creating folders and files.
- Maintaining SQLite metadata and search records.
- Regenerating all indexes and prompts.

## 5. Storage Model

The filesystem should remain the source of truth for research content.

SQLite should only store metadata such as:

- File IDs
- Display names
- Folder IDs
- Tags
- Summaries
- Upload dates
- File paths
- Ordering information

The Markdown files themselves should remain real files on disk so they are never locked inside the app.

Proposed structure:

```txt
research-brain/
  imports/
    archive/
      <import-id>-<original-name>.md
      <import-id>.manifest.json

  vault/
    _inbox/
      docs/
      folder.index.md
      folder.prompt.md

    folders/
      codex-workflows/
        docs/
        folder.index.md
        folder.prompt.md

      ai-agents/
        docs/
        folder.index.md
        folder.prompt.md

  brain.index.md
  brain.prompt.md
  brain.sqlite
```

## 6. Prompt Strategy

The project should not rely on one huge prompt that contains everything.

Instead, it should generate a layered prompt system:

- `brain.prompt.md`: the main global prompt for Codex.
- `brain.index.md`: a high-level map of all folders and their purposes.
- `folder.prompt.md`: a folder-specific prompt that tells Codex how to use that folder.
- `folder.index.md`: a structured index of the files inside a folder.

This gives Codex enough context to decide what to inspect deeply while avoiding unnecessary token usage.

## 7. Folder Prompt Behavior

Each folder should have a copyable English prompt.

The prompt should tell Codex:

- What the folder is about.
- Which Markdown files are inside it.
- Which files are most important.
- What order to inspect files in, if relevant.
- To deeply analyze the referenced files before completing the task.
- To align its output with the research stored in that folder.

The prompt should include local file paths so Codex can open the files directly.

## 8. Global Brain Prompt Behavior

The global prompt should act as a router prompt.

It should tell Codex:

- Start by reading `brain.index.md`.
- Identify which folders are relevant to the user's current task.
- Read only the relevant folder indexes first.
- Deeply inspect the Markdown files from the relevant folders.
- Avoid reading unrelated files unless the task clearly requires it.
- Use the research vault as the main context source for the task.

The global prompt should be copyable from the app.

## 9. Inbox Folder

The app includes a default `_inbox` folder as a safety and recovery location.

The `_inbox` folder is used for:

- Newly uploaded files that have not been categorized yet.
- Large research files that need later sorting.
- Temporary research dumps.
- Large mixed-information files that may contain both valuable and irrelevant content.

The `_inbox` folder should also have its own copyable prompt.

That prompt should ask Codex to:

- Analyze the files inside `_inbox`.
- Compare them with the existing folder indexes.
- Identify the valuable information inside each file.
- Ignore or clearly mark irrelevant, duplicated, outdated, or low-value information.
- Split useful information into meaningful sections when a single file contains multiple topics.
- Suggest which existing folders each file belongs in.
- Suggest new folders when needed.
- Suggest whether one large file should remain as one document or be split into multiple smaller Markdown files.
- Suggest updates for folder indexes and prompts.

The normal import workflow no longer requires the user to place files into `_inbox`. Codex analyzes and distributes them automatically. The inbox remains available for exceptional cases, recovery, and future bulk reprocessing workflows.

The `_inbox` prompt should make it clear that Codex must not blindly preserve everything. Codex should distinguish between core research value and unnecessary text, then propose a clean organization plan.

Example behavior expected from the `_inbox` prompt:

- Read all Markdown files in `_inbox`.
- Detect the main topics and subtopics.
- Extract the useful parts.
- Skip or mark content that does not add meaningful value.
- Recommend destination folders for each useful section.
- Recommend new folders if no existing folder fits.
- Recommend clean filenames for extracted sections.
- Recommend updates to `folder.index.md`, `folder.prompt.md`, and `brain.index.md`.

## 10. MVP Scope

The user interface contains exactly two primary modules:

- `Import`: one Markdown selector, automatic progress, and a final `Ready` state.
- `Structure`: folder tree, generated knowledge files, file preview, folder indexes, and copyable prompts.

Manual folder creation, manual naming, and manual file movement are not part of the primary workflow.

## 11. Later Improvements

Possible future features:

- Cross-import semantic duplicate detection.
- Local embedding-based retrieval.
- Import history, rollback, and reprocessing.
- Batch Markdown import.
- Prompt version history.
- File relationship graph.
- Better conflict handling when knowledge files overlap.

## 12. Guiding Principle

This app should be a local, transparent, Codex-optimized research brain.

It should not hide files in a proprietary format.
It should use Codex CLI through a constrained, validated analysis contract.
It should preserve every original import before applying automatic decisions.

It should help the user keep research organized and help Codex understand exactly where to look, what to read, and how deeply to analyze the available Markdown knowledge.
