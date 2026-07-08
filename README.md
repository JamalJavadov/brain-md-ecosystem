# Codex Research Brain

Local-first Markdown research brain with automatic Codex CLI organization.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/
```

The API runs at:

```txt
http://127.0.0.1:4000/
```

## macOS App

Install the native launcher into `/Applications`:

```bash
npm run install:mac
```

Then open `Codex Research Brain` from the Applications folder. The app starts
the local backend automatically and displays the interface in its own macOS
window. Closing the app also stops the backend process that it started.

## Local Data

The app stores the research brain under:

```txt
research-brain/
```

Important generated files:

- `research-brain/brain.index.md`
- `research-brain/brain.prompt.md`
- `research-brain/vault/folders/<folder-slug>/folder.index.md`
- `research-brain/vault/folders/<folder-slug>/folder.prompt.md`
- `research-brain/vault/folders/<folder-slug>/docs/*.md`
- `research-brain/imports/archive/`
- `research-brain/brain.sqlite`

Markdown files stay as real files on disk. SQLite stores metadata. Every original
import is preserved in the archive together with a JSON manifest that records
which generated files were indexed.

## Current Features

- Deep automatic Markdown analysis with Codex CLI.
- Mixed-topic source splitting into clean, standalone knowledge files.
- Automatic reuse of suitable folders and creation of new folders.
- Removal of duplicated, irrelevant, outdated, or low-value source material.
- Hash-based duplicate protection for repeated source files and repeated generated knowledge files.
- Generated summaries, tags, keywords, importance scores, and source links.
- Import progress UI.
- Structure browser for folders and files.
- Markdown file preview.
- Folder prompt generation.
- Global brain prompt generation.
- Folder index generation.
- Copyable prompts in a tabbed prompt panel.
- Main global prompt copy button directly on the import screen.

## Automatic Workflow

1. Open the app.
2. Go to the `Import` module.
3. Choose a `.md` file.
4. Click `Import Automatically`.
5. Wait until progress reaches `100%` and the status shows `Ready`.
6. Go to the `Structure` module to inspect the generated folder and file placement.

The backend calls Codex CLI in workspace-write mode. Codex deeply evaluates the
source, extracts only valuable knowledge, splits unrelated topics when useful,
creates the correct folder structure, and writes cleaned Markdown files directly
under `research-brain/vault/folders/`. The app then scans the vault, updates
SQLite metadata, archives the untouched source, and regenerates all indexes and
prompts.

Before Codex runs, the backend checks the uploaded Markdown content hash. If the
same source has already been imported, the app reuses the existing indexed
knowledge files instead of running Codex or creating more folders. During vault
indexing, generated Markdown files are also fingerprinted without frontmatter; if
Codex writes a duplicate knowledge unit, the duplicate file is removed and the
existing file is reused.

The app does not impose a fixed 240-second Codex timeout. Large Markdown files
are allowed to run as long as Codex needs, subject to Codex availability and
account usage limits.

Every automatic analysis currently uses the recommended `gpt-5.5` model with
`high` reasoning effort. These defaults can be updated through the
`CODEX_MODEL` and `CODEX_REASONING_EFFORT` environment variables when a newer
recommended Codex model becomes available.

The user-facing workflow has only two modules:

- `Import`: select one Markdown file and wait for `Ready`.
- `Structure`: inspect the automatically generated folders, knowledge files,
  indexes, and copyable prompts.
