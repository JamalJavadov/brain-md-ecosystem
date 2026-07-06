import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import multer from "multer";

const PORT = Number(process.env.PORT ?? 4000);
const ROOT_DIR = process.cwd();
const BRAIN_DIR = path.join(ROOT_DIR, "research-brain");
const VAULT_DIR = path.join(BRAIN_DIR, "vault");
const FOLDERS_DIR = path.join(VAULT_DIR, "folders");
const IMPORTS_DIR = path.join(BRAIN_DIR, "imports");
const DB_PATH = path.join(BRAIN_DIR, "brain.sqlite");
const CLIENT_DIST_DIR = path.join(ROOT_DIR, "dist");
const CODEX_BIN = process.env.CODEX_BIN ?? "/Applications/Codex.app/Contents/Resources/codex";
const CODEX_MODEL = process.env.CODEX_MODEL ?? "gpt-5.5";
const CODEX_REASONING_EFFORT = process.env.CODEX_REASONING_EFFORT ?? "high";

type Folder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_inbox: number;
  created_at: string;
};

type ResearchFile = {
  id: string;
  folder_id: string;
  display_name: string;
  original_name: string;
  stored_name: string;
  path: string;
  size_bytes: number;
  created_at: string;
  summary: string;
  tags_json: string;
  keywords_json: string;
  importance: number;
  source_import_id: string;
  source_section: string;
};

type MarkdownMetadata = {
  title: string;
  summary: string;
  tags: string[];
  keywords: string[];
  importance: number;
  sourceImportId: string;
  sourceFile: string;
  sourceSection: string;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

function safeFilename(value: string) {
  const parsed = path.parse(value);
  const base = slugify(parsed.name);
  return `${base}.md`;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readTextIfExists(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function writeText(filePath: string, content: string) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function folderRoot(folder: Folder) {
  return path.join(FOLDERS_DIR, folder.slug);
}

function folderDocsDir(folder: Folder) {
  return path.join(folderRoot(folder), "docs");
}

function uniqueStoredName(folder: Folder, requestedName: string, currentPath = "") {
  const docsDir = folderDocsDir(folder);
  const first = safeFilename(requestedName);
  let candidate = first;
  let suffix = 2;

  while (fs.existsSync(path.join(docsDir, candidate)) && path.join(docsDir, candidate) !== currentPath) {
    candidate = `${path.parse(first).name}-${suffix}.md`;
    suffix += 1;
  }

  return candidate;
}

function uniqueFolderSlug(requestedName: string) {
  const baseSlug = slugify(requestedName);
  let slug = baseSlug;
  let suffix = 2;
  while (db.prepare("SELECT id FROM folders WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

ensureDir(BRAIN_DIR);
ensureDir(VAULT_DIR);
ensureDir(FOLDERS_DIR);
ensureDir(IMPORTS_DIR);

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_inbox INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    folder_id TEXT NOT NULL REFERENCES folders(id),
    display_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS imports (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    source_path TEXT NOT NULL,
    document_title TEXT NOT NULL,
    document_summary TEXT NOT NULL,
    discarded_summary TEXT NOT NULL DEFAULT '',
    segment_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS file_search USING fts5(
    file_id UNINDEXED,
    display_name,
    original_name,
    folder_name,
    content_preview
  );
`);

function ensureFileColumn(name: string, definition: string) {
  const columns = db.prepare("PRAGMA table_info(files)").all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === name)) {
    db.exec(`ALTER TABLE files ADD COLUMN ${name} ${definition}`);
  }
}

ensureFileColumn("summary", "TEXT NOT NULL DEFAULT ''");
ensureFileColumn("tags_json", "TEXT NOT NULL DEFAULT '[]'");
ensureFileColumn("keywords_json", "TEXT NOT NULL DEFAULT '[]'");
ensureFileColumn("importance", "INTEGER NOT NULL DEFAULT 3");
ensureFileColumn("source_import_id", "TEXT NOT NULL DEFAULT ''");
ensureFileColumn("source_section", "TEXT NOT NULL DEFAULT ''");

function allFolders() {
  return db.prepare("SELECT * FROM folders ORDER BY name ASC").all() as Folder[];
}

function getFolder(id: string) {
  return db.prepare("SELECT * FROM folders WHERE id = ?").get(id) as Folder | undefined;
}

function getFolderBySlug(slug: string) {
  return db.prepare("SELECT * FROM folders WHERE slug = ?").get(slug) as Folder | undefined;
}

function getFile(id: string) {
  return db.prepare("SELECT * FROM files WHERE id = ?").get(id) as ResearchFile | undefined;
}

function filesForFolder(folderId: string) {
  return db
    .prepare("SELECT * FROM files WHERE folder_id = ? ORDER BY display_name ASC")
    .all(folderId) as ResearchFile[];
}

function allFiles() {
  return db.prepare("SELECT * FROM files ORDER BY created_at DESC").all() as ResearchFile[];
}

function createFolderRecord(name: string, description: string) {
  const folder: Folder = {
    id: randomUUID(),
    slug: uniqueFolderSlug(name),
    name,
    description,
    is_inbox: 0,
    created_at: nowIso()
  };

  db.prepare(
    "INSERT INTO folders (id, slug, name, description, is_inbox, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(folder.id, folder.slug, folder.name, folder.description, folder.is_inbox, folder.created_at);
  ensureDir(folderDocsDir(folder));
  return folder;
}

function createFileRecord(
  folder: Folder,
  params: {
    displayName: string;
    originalName: string;
    content: string;
    summary?: string;
    tags?: string[];
    keywords?: string[];
    importance?: number;
    sourceImportId?: string;
    sourceSection?: string;
  }
) {
  const storedName = uniqueStoredName(folder, params.displayName);
  const destination = path.join(folderDocsDir(folder), storedName);
  writeText(destination, params.content);

  const researchFile: ResearchFile = {
    id: randomUUID(),
    folder_id: folder.id,
    display_name: params.displayName,
    original_name: params.originalName,
    stored_name: storedName,
    path: destination,
    size_bytes: Buffer.byteLength(params.content, "utf8"),
    created_at: nowIso(),
    summary: params.summary ?? "",
    tags_json: JSON.stringify(params.tags ?? []),
    keywords_json: JSON.stringify(params.keywords ?? []),
    importance: Math.max(1, Math.min(5, params.importance ?? 3)),
    source_import_id: params.sourceImportId ?? "",
    source_section: params.sourceSection ?? ""
  };

  db.prepare(
    `INSERT INTO files (
      id, folder_id, display_name, original_name, stored_name, path, size_bytes, created_at,
      summary, tags_json, keywords_json, importance, source_import_id, source_section
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    researchFile.id,
    researchFile.folder_id,
    researchFile.display_name,
    researchFile.original_name,
    researchFile.stored_name,
    researchFile.path,
    researchFile.size_bytes,
    researchFile.created_at,
    researchFile.summary,
    researchFile.tags_json,
    researchFile.keywords_json,
    researchFile.importance,
    researchFile.source_import_id,
    researchFile.source_section
  );
  refreshSearchForFile(researchFile, folder);
  return researchFile;
}

function ensureFolderFiles() {
  for (const folder of allFolders()) {
    ensureDir(folderDocsDir(folder));
    const indexPath = path.join(folderRoot(folder), "folder.index.md");
    const promptPath = path.join(folderRoot(folder), "folder.prompt.md");
    if (!fs.existsSync(indexPath)) writeText(indexPath, buildFolderIndex(folder));
    if (!fs.existsSync(promptPath)) writeText(promptPath, buildFolderPrompt(folder));
  }
}

function parseStringArray(raw: string) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function formatPromptList(items: string[], fallback = "None listed.") {
  const cleanItems = items.map((item) => item.trim()).filter(Boolean);
  return cleanItems.length ? cleanItems.join(", ") : fallback;
}

function buildFolderIndex(folder: Folder) {
  const files = filesForFolder(folder.id);
  const lines = [
    `# ${folder.name} - Folder Index`,
    "",
    `Folder path: \`${folderRoot(folder)}\``,
    "",
    "## Purpose",
    "",
    folder.description || "No description has been added yet.",
    "",
    "## Files",
    ""
  ];

  if (files.length === 0) {
    lines.push("No Markdown files are stored in this folder yet.");
  } else {
    for (const file of files) {
      const tags = parseStringArray(file.tags_json);
      const keywords = parseStringArray(file.keywords_json);
      lines.push(`- ${file.display_name}`);
      lines.push(`  - Path: \`${file.path}\``);
      lines.push(`  - Original file: \`${file.original_name}\``);
      if (file.summary) lines.push(`  - Summary: ${file.summary}`);
      if (tags.length) lines.push(`  - Tags: ${tags.join(", ")}`);
      if (keywords.length) lines.push(`  - Keywords: ${keywords.join(", ")}`);
      lines.push(`  - Importance: ${file.importance}/5`);
      if (file.source_section) lines.push(`  - Source section: ${file.source_section}`);
      if (file.source_import_id) lines.push(`  - Source import ID: \`${file.source_import_id}\``);
      lines.push(`  - Added: ${file.created_at}`);
    }
  }

  lines.push("");
  lines.push("## Maintenance Notes");
  lines.push("");
  lines.push("- Keep this index focused on what Codex needs to know before reading files deeply.");
  lines.push("- Update descriptions when files are moved, split, renamed, or removed.");
  lines.push("");

  return lines.join("\n");
}

function buildFolderPrompt(folder: Folder) {
  const files = filesForFolder(folder.id);
  const fileLines =
    files.length === 0
      ? ["No Markdown files are currently stored in this folder."]
      : files.map(
          (file) =>
            `- ${file.display_name} (importance ${file.importance}/5): ${file.path}${file.summary ? `\n  Summary: ${file.summary}` : ""}`
        );

  return [
    `# ${folder.name} - Codex Prompt`,
    "",
    "Use this prompt when the current task should be guided by this research folder.",
    "",
    "## Instructions For Codex",
    "",
    `You are working with the local research folder named "${folder.name}".`,
    `Folder path: ${folderRoot(folder)}`,
    `Folder index path: ${path.join(folderRoot(folder), "folder.index.md")}`,
    "",
    "Before completing the user's task:",
    "",
    "1. Read the folder index first.",
    "2. Identify which Markdown files are relevant to the task.",
    "3. Deeply analyze the relevant files listed below.",
    "4. Align your work with the research and decisions stored in this folder.",
    "5. Avoid reading unrelated files unless the task clearly requires it.",
    "",
    "## Folder Purpose",
    "",
    folder.description || "No description has been added yet.",
    "",
    "## Markdown Files",
    "",
    ...fileLines,
    ""
  ].join("\n");
}

function buildBrainIndex() {
  const folders = allFolders();
  const lines = [
    "# Codex Research Brain - Global Index",
    "",
    `Brain root: \`${BRAIN_DIR}\``,
    "",
    "Use this index as the high-level map of available local research folders.",
    "",
    "## Folders",
    ""
  ];

  for (const folder of folders) {
    const folderFiles = filesForFolder(folder.id);
    lines.push(`### ${folder.name}`);
    lines.push("");
    lines.push(`- Slug: \`${folder.slug}\``);
    lines.push(`- Folder path: \`${folderRoot(folder)}\``);
    lines.push(`- Folder index: \`${path.join(folderRoot(folder), "folder.index.md")}\``);
    lines.push(`- Folder prompt: \`${path.join(folderRoot(folder), "folder.prompt.md")}\``);
    lines.push(`- Purpose: ${folder.description || "No description has been added yet."}`);
    lines.push(`- File count: ${folderFiles.length}`);
    const priorityFiles = [...folderFiles]
      .sort((left, right) => right.importance - left.importance)
      .slice(0, 5);
    if (priorityFiles.length) {
      lines.push("- Priority knowledge:");
      for (const file of priorityFiles) {
        lines.push(
          `  - ${file.display_name} (${file.importance}/5): ${file.summary || "No summary available."}`
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function buildBrainPrompt() {
  const folders = allFolders();
  const totalFiles = folders.reduce((count, folder) => count + filesForFolder(folder.id).length, 0);
  const lines = [
    "# Codex Research Brain - Global Main Prompt",
    "",
    "You are Codex working with a local Markdown research vault. This prompt is the master router for that vault.",
    "Use it to find the right research files, read them in the right order, and ground your answer or implementation in the user's saved knowledge.",
    "",
    "## Vault Identity",
    "",
    `- Brain root: ${BRAIN_DIR}`,
    `- Global index: ${path.join(BRAIN_DIR, "brain.index.md")}`,
    `- Global prompt: ${path.join(BRAIN_DIR, "brain.prompt.md")}`,
    `- Vault folders root: ${FOLDERS_DIR}`,
    `- Indexed folders: ${folders.length}`,
    `- Indexed Markdown files: ${totalFiles}`,
    "",
    "## Non-Negotiable Operating Rules",
    "",
    "1. Treat this research vault as the primary local knowledge source whenever the user's task overlaps with the folder and file map below.",
    "2. Do not answer from this prompt alone when a listed file is relevant. Open and read the relevant Markdown files before making final claims, recommendations, prompts, plans, code, or creative decisions.",
    "3. Start with the global index for a compact overview, then read the relevant folder indexes, then read only the specific Markdown files needed for the task.",
    "4. Use folder purposes, summaries, tags, keywords, source sections, and importance scores to route the task. Do not read every file by default.",
    "5. If the task spans multiple topics, combine only the matching folders and files. Resolve contradictions explicitly instead of blending them silently.",
    "6. If no listed folder or file matches the task, say the research brain does not currently contain matching context and continue with general reasoning only if the user wants that.",
    "7. Preserve the user's intent and the saved research constraints. Do not invent facts that are not in the vault.",
    "8. Mention or cite local file paths when they would help the user verify where an answer came from.",
    "9. Do not modify, move, delete, or regenerate vault files unless the user explicitly asks you to maintain the research brain.",
    "",
    "## Recommended Retrieval Workflow",
    "",
    "Use this workflow for every task that may need the vault:",
    "",
    "1. Read the user's task and extract the real domain, deliverable, constraints, and keywords.",
    `2. Open the global index: ${path.join(BRAIN_DIR, "brain.index.md")}`,
    "3. Pick candidate folders from the routing map below.",
    "4. Open each candidate folder's `folder.index.md` for a compact file-level overview.",
    "5. Open the exact Markdown files whose summaries, tags, keywords, or source sections match the task.",
    "6. Synthesize from the selected files. Keep unrelated folders out of context to save tokens.",
    "7. Before finalizing, check whether the answer respects the vault's examples, workflows, warnings, constraints, and decisions.",
    "",
    "## Fast Local Commands",
    "",
    "When shell access is available, these commands are useful:",
    "",
    `- List vault files: \`rg --files ${JSON.stringify(FOLDERS_DIR)}\``,
    `- Search research text: \`rg -n \"<topic or keyword>\" ${JSON.stringify(FOLDERS_DIR)}\``,
    `- Open global index: \`sed -n '1,220p' ${JSON.stringify(path.join(BRAIN_DIR, "brain.index.md"))}\``,
    "",
    "## Routing Map",
    ""
  ];

  if (folders.length === 0) {
    lines.push("No research folders have been indexed yet.");
    lines.push("");
    return lines.join("\n");
  }

  for (const folder of folders) {
    const files = filesForFolder(folder.id);
    lines.push(`### ${folder.name}`);
    lines.push("");
    lines.push(`- Slug: \`${folder.slug}\``);
    lines.push(`- Purpose: ${folder.description || "No description has been added yet."}`);
    lines.push(`- Folder path: \`${folderRoot(folder)}\``);
    lines.push(`- Folder index: \`${path.join(folderRoot(folder), "folder.index.md")}\``);
    lines.push(`- Folder prompt: \`${path.join(folderRoot(folder), "folder.prompt.md")}\``);
    lines.push(`- Markdown file count: ${files.length}`);
    const folderTags = Array.from(new Set(files.flatMap((file) => parseStringArray(file.tags_json)))).slice(0, 24);
    const folderKeywords = Array.from(new Set(files.flatMap((file) => parseStringArray(file.keywords_json)))).slice(0, 32);
    lines.push(`- Folder tags: ${formatPromptList(folderTags)}`);
    lines.push(`- Folder keywords: ${formatPromptList(folderKeywords)}`);
    lines.push("");

    if (files.length === 0) {
      lines.push("No Markdown files are currently stored in this folder.");
      lines.push("");
      continue;
    }

    lines.push("#### Markdown Files");
    lines.push("");

    for (const file of files) {
      const tags = parseStringArray(file.tags_json);
      const keywords = parseStringArray(file.keywords_json);
      lines.push(`- ${file.display_name}`);
      lines.push(`  - Path: \`${file.path}\``);
      lines.push(`  - Summary: ${file.summary || "No summary available."}`);
      lines.push(`  - Importance: ${file.importance}/5`);
      lines.push(`  - Tags: ${formatPromptList(tags)}`);
      lines.push(`  - Keywords: ${formatPromptList(keywords)}`);
      lines.push(`  - Source section: ${file.source_section || "Not specified."}`);
      lines.push(`  - Original source: ${file.original_name || "Not specified."}`);
      lines.push(`  - Added: ${file.created_at}`);
    }

    lines.push("");
  }

  lines.push("## Final Handoff Instruction");
  lines.push("");
  lines.push("Before answering the user, route the task through this map, open the relevant local indexes and Markdown files, and base the final work on the selected research. This prompt is a map, not a substitute for reading the source files.");
  lines.push("");

  return lines.join("\n");
}

function regeneratePrompts() {
  ensureFolderFiles();
  for (const folder of allFolders()) {
    writeText(path.join(folderRoot(folder), "folder.index.md"), buildFolderIndex(folder));
    writeText(path.join(folderRoot(folder), "folder.prompt.md"), buildFolderPrompt(folder));
  }
  writeText(path.join(BRAIN_DIR, "brain.index.md"), buildBrainIndex());
  writeText(path.join(BRAIN_DIR, "brain.prompt.md"), buildBrainPrompt());
}

function refreshSearchForFile(file: ResearchFile, folder: Folder) {
  const preview = [
    file.summary,
    ...parseStringArray(file.tags_json),
    ...parseStringArray(file.keywords_json),
    readTextIfExists(file.path).slice(0, 6000)
  ].join("\n");
  db.prepare("DELETE FROM file_search WHERE file_id = ?").run(file.id);
  db.prepare(
    "INSERT INTO file_search (file_id, display_name, original_name, folder_name, content_preview) VALUES (?, ?, ?, ?, ?)"
  ).run(file.id, file.display_name, file.original_name, folder.name, preview);
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Research";
}

function markdownFilesIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...markdownFilesIn(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseMetadataArray(value: string) {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMarkdownMetadata(filePath: string, content: string): MarkdownMetadata {
  const metadata: Record<string, string> = {};
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---\s*/);
  if (frontmatter) {
    for (const line of frontmatter[1].split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (match) metadata[match[1].trim().toLowerCase()] = match[2].trim();
    }
  }

  const body = frontmatter ? content.slice(frontmatter[0].length) : content;
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const firstParagraph =
    body
      .replace(/^#.*$/gm, "")
      .split(/\n\s*\n/)
      .map((part) => part.trim().replace(/^>\s*/, ""))
      .find((part) => part.length > 40) ?? "";
  const fileTitle = titleFromSlug(path.parse(filePath).name);

  return {
    title: (metadata.title || heading || fileTitle).replace(/^["']|["']$/g, "").slice(0, 140),
    summary: (metadata.summary || firstParagraph || "Imported research knowledge.")
      .replace(/^["']|["']$/g, "")
      .slice(0, 1400),
    tags: parseMetadataArray(metadata.tags || "").slice(0, 12),
    keywords: parseMetadataArray(metadata.keywords || "").slice(0, 16),
    importance: Math.max(1, Math.min(5, Number(metadata.importance || 3))),
    sourceImportId: (metadata.source_import_id || metadata.sourceimportid || "").replace(/^["']|["']$/g, ""),
    sourceFile: (metadata.source_file || metadata.sourcefile || "").replace(/^["']|["']$/g, ""),
    sourceSection: (metadata.source_section || metadata.sourcesection || "").replace(/^["']|["']$/g, "").slice(0, 300)
  };
}

function syncVaultFromDisk(importId = "", originalName = "") {
  ensureDir(FOLDERS_DIR);
  const beforePaths = new Set(allFiles().map((file) => file.path));
  const folders = fs
    .readdirSync(FOLDERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."));

  for (const entry of folders) {
    const slug = slugify(entry.name);
    const folderPath = path.join(FOLDERS_DIR, entry.name);
    const docsDir = path.join(folderPath, "docs");
    const docs = markdownFilesIn(docsDir);
    if (docs.length === 0) continue;

    let folder = getFolderBySlug(slug);
    if (!folder) {
      const firstMetadata = parseMarkdownMetadata(docs[0], readTextIfExists(docs[0]));
      folder = createFolderRecord(titleFromSlug(slug), firstMetadata.summary || `Research related to ${titleFromSlug(slug)}.`);
      if (folder.slug !== slug) {
        const correctedFolder: Folder = { ...folder, slug };
        db.prepare("UPDATE folders SET slug = ? WHERE id = ?").run(slug, folder.id);
        folder = correctedFolder;
      }
    }

    ensureDir(folderDocsDir(folder));
    for (const docPath of docs) {
      const content = readTextIfExists(docPath);
      const metadata = parseMarkdownMetadata(docPath, content);
      const existing = db.prepare("SELECT * FROM files WHERE path = ?").get(docPath) as ResearchFile | undefined;

      if (existing) {
        const updated: ResearchFile = {
          ...existing,
          display_name: metadata.title,
          original_name: metadata.sourceFile || existing.original_name || originalName,
          size_bytes: Buffer.byteLength(content, "utf8"),
          summary: metadata.summary,
          tags_json: JSON.stringify(metadata.tags),
          keywords_json: JSON.stringify(metadata.keywords),
          importance: metadata.importance,
          source_import_id: metadata.sourceImportId || existing.source_import_id || importId,
          source_section: metadata.sourceSection || existing.source_section
        };
        db.prepare(
          `UPDATE files
           SET display_name = ?, original_name = ?, size_bytes = ?, summary = ?, tags_json = ?,
               keywords_json = ?, importance = ?, source_import_id = ?, source_section = ?
           WHERE id = ?`
        ).run(
          updated.display_name,
          updated.original_name,
          updated.size_bytes,
          updated.summary,
          updated.tags_json,
          updated.keywords_json,
          updated.importance,
          updated.source_import_id,
          updated.source_section,
          updated.id
        );
        refreshSearchForFile(updated, folder);
      } else {
        const researchFile: ResearchFile = {
          id: randomUUID(),
          folder_id: folder.id,
          display_name: metadata.title,
          original_name: metadata.sourceFile || originalName || path.basename(docPath),
          stored_name: path.basename(docPath),
          path: docPath,
          size_bytes: Buffer.byteLength(content, "utf8"),
          created_at: nowIso(),
          summary: metadata.summary,
          tags_json: JSON.stringify(metadata.tags),
          keywords_json: JSON.stringify(metadata.keywords),
          importance: metadata.importance,
          source_import_id: metadata.sourceImportId || importId,
          source_section: metadata.sourceSection
        };
        db.prepare(
          `INSERT INTO files (
            id, folder_id, display_name, original_name, stored_name, path, size_bytes, created_at,
            summary, tags_json, keywords_json, importance, source_import_id, source_section
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          researchFile.id,
          researchFile.folder_id,
          researchFile.display_name,
          researchFile.original_name,
          researchFile.stored_name,
          researchFile.path,
          researchFile.size_bytes,
          researchFile.created_at,
          researchFile.summary,
          researchFile.tags_json,
          researchFile.keywords_json,
          researchFile.importance,
          researchFile.source_import_id,
          researchFile.source_section
        );
        refreshSearchForFile(researchFile, folder);
      }
    }
  }

  const missingFiles = allFiles().filter((file) => !fs.existsSync(file.path));
  for (const file of missingFiles) {
    db.prepare("DELETE FROM file_search WHERE file_id = ?").run(file.id);
    db.prepare("DELETE FROM files WHERE id = ?").run(file.id);
  }

  regeneratePrompts();
  return allFiles().filter((file) => !beforePaths.has(file.path) || (importId && file.source_import_id === importId));
}

function cleanupLegacyEmptyFolders() {
  for (const folder of allFolders()) {
    const shouldRemove = folder.is_inbox || folder.slug === "youtube";
    if (!shouldRemove || filesForFolder(folder.id).length > 0) continue;
    db.prepare("DELETE FROM folders WHERE id = ?").run(folder.id);
    fs.rmSync(folderRoot(folder), { recursive: true, force: true });
  }
  fs.rmSync(path.join(VAULT_DIR, "_inbox"), { recursive: true, force: true });
}

function buildCodexWritePrompt(sourcePath: string, originalName: string, importId: string) {
  const folders = allFolders().map((folder) => ({
    slug: folder.slug,
    name: folder.name,
    description: folder.description,
    fileCount: filesForFolder(folder.id).length
  }));

  return [
    "You are organizing a local Markdown research vault for Codex.",
    "",
    "Deeply analyze the uploaded Markdown file and create clean, standalone Markdown knowledge files directly in the vault.",
    "",
    "You must write files. Do not return a large JSON plan.",
    "",
    "Source file to analyze:",
    sourcePath,
    "",
    `Original upload name: ${originalName}`,
    `Source import ID: ${importId}`,
    `Vault folder root: ${FOLDERS_DIR}`,
    "",
    "Existing folders you may reuse:",
    JSON.stringify(folders, null, 2),
    "",
    "Required workflow:",
    "1. Read the source file deeply.",
    "2. Identify valuable knowledge and remove duplicated, outdated, navigational, empty, or low-value text.",
    "3. Split only when it creates genuinely useful standalone knowledge units. If the whole document is coherent, keep it as one file.",
    "4. If headings are weak or missing, infer sections semantically from topics, workflows, examples, warnings, decisions, and constraints.",
    "5. Reuse an existing folder slug only when it clearly fits. Otherwise create a new English slug under the vault folder root.",
    "6. For every useful knowledge unit, create exactly one Markdown file at:",
    "   research-brain/vault/folders/<folder-slug>/docs/<clean-file-slug>.md",
    "7. Use only lowercase kebab-case slugs for folder and file names.",
    "8. Do not edit brain.index.md, brain.prompt.md, folder.index.md, folder.prompt.md, brain.sqlite, package files, source code, or the original uploaded file.",
    "9. Do not create Inbox or Youtube folders unless the source content truly requires those topics.",
    "",
    "Every created Markdown file must start with this YAML-style frontmatter:",
    "---",
    `source_import_id: ${JSON.stringify(importId)}`,
    `source_file: ${JSON.stringify(originalName)}`,
    "source_section: \"Original section or inferred topic\"",
    "title: \"Clean standalone English title\"",
    "summary: \"Concise English summary of the useful knowledge in this file\"",
    "importance: 1",
    "tags: [\"tag-one\", \"tag-two\"]",
    "keywords: [\"search phrase\", \"specific concept\"]",
    "---",
    "",
    "Then write polished Markdown content with a clear H1 and useful subsections.",
    "Preserve factual details, constraints, examples, commands, code snippets, workflows, warnings, and decisions from the source.",
    "Do not hallucinate or add unsupported claims.",
    "",
    "When finished, reply briefly with the list of files you created."
  ].join("\n");
}

function appendCapped(current: string, chunk: Buffer, maxLength = 120_000) {
  const next = current + chunk.toString();
  return next.length > maxLength ? next.slice(next.length - maxLength) : next;
}

function summarizeProcessFailure(code: number | null, output: string) {
  const compact = output
    .replace(/\u001b\[[0-9;]*m/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const joined = compact.join("\n");
  const usageLimit = joined.match(/You've hit your usage limit[\s\S]*?try again at ([^\n.]+)/i);
  if (usageLimit) {
    return `Codex usage limit reached. Try again at ${usageLimit[1].trim()}.`;
  }

  const meaningful = compact
    .filter(
      (line) =>
        !line.includes("WARN codex_core_plugins") &&
        !line.includes("WARN codex_core_skills") &&
        !line.startsWith("OpenAI Codex") &&
        !line.startsWith("--------") &&
        !line.startsWith("workdir:") &&
        !line.startsWith("model:") &&
        !line.startsWith("provider:") &&
        !line.startsWith("approval:") &&
        !line.startsWith("sandbox:") &&
        !line.startsWith("reasoning ") &&
        !line.startsWith("session id:") &&
        line !== "user"
    )
    .slice(-8);

  return `Codex CLI exited with code ${code ?? "unknown"}.${meaningful.length ? ` ${meaningful.join(" ")}` : ""}`;
}

function runProcess(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.on("data", (chunk) => {
      stdout = appendCapped(stdout, chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendCapped(stderr, chunk);
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(summarizeProcessFailure(code, `${stderr}\n${stdout}`)));
      }
    });
  });
}

async function runCodexFileWriter(sourcePath: string, originalName: string, importId: string) {
  await runProcess(CODEX_BIN, [
    "--ask-for-approval",
    "never",
    "--model",
    CODEX_MODEL,
    "--config",
    `model_reasoning_effort=${JSON.stringify(CODEX_REASONING_EFFORT)}`,
    "exec",
    "--cd",
    ROOT_DIR,
    "--skip-git-repo-check",
    "--sandbox",
    "workspace-write",
    "--color",
    "never",
    buildCodexWritePrompt(sourcePath, originalName, importId)
  ]);
}

cleanupLegacyEmptyFolders();
regeneratePrompts();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, brainDir: BRAIN_DIR });
});

app.get("/api/folders", (_req, res) => {
  res.json(allFolders());
});

app.get("/api/structure", (_req, res) => {
  const folders = allFolders().map((folder) => ({
    ...folder,
    path: folderRoot(folder),
    promptPath: path.join(folderRoot(folder), "folder.prompt.md"),
    indexPath: path.join(folderRoot(folder), "folder.index.md"),
    files: filesForFolder(folder.id)
  }));

  res.json({
    brainDir: BRAIN_DIR,
    brainPromptPath: path.join(BRAIN_DIR, "brain.prompt.md"),
    brainIndexPath: path.join(BRAIN_DIR, "brain.index.md"),
    folders
  });
});

app.post("/api/folders", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();
  if (!name) {
    res.status(400).json({ error: "Folder name is required." });
    return;
  }

  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;
  while (db.prepare("SELECT id FROM folders WHERE slug = ?").get(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const folder: Folder = {
    id: randomUUID(),
    slug,
    name,
    description,
    is_inbox: 0,
    created_at: nowIso()
  };

  db.prepare(
    "INSERT INTO folders (id, slug, name, description, is_inbox, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(folder.id, folder.slug, folder.name, folder.description, folder.is_inbox, folder.created_at);
  ensureDir(folderDocsDir(folder));
  regeneratePrompts();
  res.status(201).json(folder);
});

app.patch("/api/folders/:id", (req, res) => {
  const folder = getFolder(req.params.id);
  if (!folder) {
    res.status(404).json({ error: "Folder was not found." });
    return;
  }

  const name = String(req.body.name ?? "").trim();
  const description = String(req.body.description ?? "").trim();
  if (!name) {
    res.status(400).json({ error: "Folder name is required." });
    return;
  }

  const updatedFolder: Folder = { ...folder, name, description };
  db.prepare("UPDATE folders SET name = ?, description = ? WHERE id = ?").run(name, description, folder.id);
  for (const file of filesForFolder(folder.id)) {
    refreshSearchForFile(file, updatedFolder);
  }
  regeneratePrompts();
  res.json(updatedFolder);
});

app.delete("/api/folders/:id", (req, res) => {
  const folder = getFolder(req.params.id);
  if (!folder) {
    res.status(404).json({ error: "Folder was not found." });
    return;
  }

  for (const file of filesForFolder(folder.id)) {
    if (fs.existsSync(file.path)) fs.rmSync(file.path);
    db.prepare("DELETE FROM file_search WHERE file_id = ?").run(file.id);
  }

  db.prepare("DELETE FROM files WHERE folder_id = ?").run(folder.id);
  db.prepare("DELETE FROM folders WHERE id = ?").run(folder.id);
  fs.rmSync(folderRoot(folder), { recursive: true, force: true });
  regeneratePrompts();
  res.json({ ok: true });
});

app.get("/api/files", (req, res) => {
  const folderId = typeof req.query.folderId === "string" ? req.query.folderId : "";
  res.json(folderId ? filesForFolder(folderId) : allFiles());
});

app.get("/api/files/:id", (req, res) => {
  const file = getFile(req.params.id);
  if (!file) {
    res.status(404).json({ error: "File was not found." });
    return;
  }

  res.json({ ...file, content: readTextIfExists(file.path) });
});

app.post("/api/files/upload", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Markdown file is required." });
    return;
  }

  if (!file.originalname.toLowerCase().endsWith(".md")) {
    res.status(400).json({ error: "Only .md files are supported in the MVP." });
    return;
  }

  const folder = getFolder(String(req.body.folderId ?? "")) ?? createFolderRecord("Imported Research", "Manually imported research files.");
  const displayName = String(req.body.displayName ?? "").trim() || path.parse(file.originalname).name;
  const researchFile = createFileRecord(folder, {
    displayName,
    originalName: file.originalname,
    content: file.buffer.toString("utf8")
  });
  regeneratePrompts();
  res.status(201).json(researchFile);
});

app.post("/api/import/auto", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "Markdown file is required." });
    return;
  }

  if (!file.originalname.toLowerCase().endsWith(".md")) {
    res.status(400).json({ error: "Only .md files can be imported automatically." });
    return;
  }

  const importId = randomUUID();
  const pendingDir = path.join(IMPORTS_DIR, "pending");
  ensureDir(pendingDir);
  const pendingPath = path.join(pendingDir, `${importId}-${safeFilename(file.originalname)}`);
  const content = file.buffer.toString("utf8");
  writeText(pendingPath, content);

  try {
    await runCodexFileWriter(pendingPath, file.originalname, importId);
    const archiveDir = path.join(IMPORTS_DIR, "archive");
    ensureDir(archiveDir);
    const archivePath = path.join(archiveDir, `${importId}-${safeFilename(file.originalname)}`);
    fs.renameSync(pendingPath, archivePath);

    const importedFiles = syncVaultFromDisk(importId, file.originalname);
    if (importedFiles.length === 0) {
      throw new Error("Codex finished but did not create any Markdown knowledge files in the vault.");
    }

    const usedFolders = new Map<string, Folder>();
    const segmentResults = importedFiles.map((importedFile) => {
      const folder = getFolder(importedFile.folder_id);
      if (folder) usedFolders.set(folder.id, folder);
      return {
        title: importedFile.display_name,
        summary: importedFile.summary,
        folderName: folder?.name ?? "Unknown Folder",
        folderSlug: folder?.slug ?? "",
        tags: parseStringArray(importedFile.tags_json),
        keywords: parseStringArray(importedFile.keywords_json),
        importance: importedFile.importance,
        fileId: importedFile.id,
        filePath: importedFile.path
      };
    });

    const documentTitle = path.parse(file.originalname).name;
    const documentSummary = `Codex organized ${importedFiles.length} Markdown knowledge unit${importedFiles.length === 1 ? "" : "s"} from ${file.originalname}.`;

    db.prepare(
      `INSERT INTO imports (
        id, original_name, source_path, document_title, document_summary,
        discarded_summary, segment_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      importId,
      file.originalname,
      archivePath,
      documentTitle,
      documentSummary,
      "Codex removed low-value or duplicated material during direct file creation when appropriate.",
      importedFiles.length,
      nowIso()
    );

    const manifestPath = path.join(archiveDir, `${importId}.manifest.json`);
    writeText(
      manifestPath,
      JSON.stringify(
        {
          importId,
          originalName: file.originalname,
          archivePath,
          generatedFiles: segmentResults
        },
        null,
        2
      )
    );

    regeneratePrompts();
    res.status(201).json({
      ok: true,
      importId,
      plan: {
        documentTitle,
        documentSummary,
        discardedSummary: "Codex wrote cleaned Markdown files directly instead of returning a large JSON plan.",
        confidence: 1
      },
      folders: [...usedFolders.values()],
      files: importedFiles,
      segments: segmentResults,
      structure: {
        brainDir: BRAIN_DIR,
        sourcePath: archivePath,
        manifestPath
      }
    });
  } catch (err) {
    res.status(500).json({
      error:
        err instanceof Error
          ? `Automatic import failed: ${err.message}`
          : "Automatic import failed while Codex was organizing the Markdown file.",
      pendingPath
    });
  }
});

app.patch("/api/files/:id/move", (req, res) => {
  const file = getFile(req.params.id);
  const targetFolder = getFolder(String(req.body.folderId ?? ""));
  if (!file || !targetFolder) {
    res.status(404).json({ error: "File or target folder was not found." });
    return;
  }

  if (file.folder_id === targetFolder.id) {
    res.json(file);
    return;
  }

  const storedName = uniqueStoredName(targetFolder, file.stored_name);
  const destination = path.join(folderDocsDir(targetFolder), storedName);
  ensureDir(path.dirname(destination));
  fs.renameSync(file.path, destination);

  const movedFile: ResearchFile = { ...file, folder_id: targetFolder.id, stored_name: storedName, path: destination };
  db.prepare("UPDATE files SET folder_id = ?, stored_name = ?, path = ? WHERE id = ?").run(
    movedFile.folder_id,
    movedFile.stored_name,
    movedFile.path,
    movedFile.id
  );
  refreshSearchForFile(movedFile, targetFolder);
  regeneratePrompts();
  res.json(movedFile);
});

app.patch("/api/files/:id", (req, res) => {
  const file = getFile(req.params.id);
  if (!file) {
    res.status(404).json({ error: "File was not found." });
    return;
  }

  const folder = getFolder(file.folder_id);
  const displayName = String(req.body.displayName ?? "").trim();
  if (!folder || !displayName) {
    res.status(400).json({ error: "A valid file name is required." });
    return;
  }

  const storedName = uniqueStoredName(folder, displayName, file.path);
  const destination = path.join(folderDocsDir(folder), storedName);
  if (destination !== file.path) {
    fs.renameSync(file.path, destination);
  }

  const renamedFile: ResearchFile = { ...file, display_name: displayName, stored_name: storedName, path: destination };
  db.prepare("UPDATE files SET display_name = ?, stored_name = ?, path = ? WHERE id = ?").run(
    renamedFile.display_name,
    renamedFile.stored_name,
    renamedFile.path,
    renamedFile.id
  );
  refreshSearchForFile(renamedFile, folder);
  regeneratePrompts();
  res.json(renamedFile);
});

app.delete("/api/files/:id", (req, res) => {
  const file = getFile(req.params.id);
  if (!file) {
    res.status(404).json({ error: "File was not found." });
    return;
  }

  if (fs.existsSync(file.path)) fs.rmSync(file.path);
  db.prepare("DELETE FROM file_search WHERE file_id = ?").run(file.id);
  db.prepare("DELETE FROM files WHERE id = ?").run(file.id);
  regeneratePrompts();
  res.json({ ok: true });
});

app.get("/api/search", (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    res.json([]);
    return;
  }

  const terms = query.match(/[a-zA-Z0-9_]+/g) ?? [];
  const matchQuery = terms.map((term) => `"${term}"`).join(" ");

  if (matchQuery) {
    const rows = db
      .prepare(
        `SELECT files.*, folders.name AS folder_name
         FROM file_search
         JOIN files ON files.id = file_search.file_id
         JOIN folders ON folders.id = files.folder_id
         WHERE file_search MATCH ?
         ORDER BY rank`
      )
      .all(matchQuery) as Array<ResearchFile & { folder_name: string }>;

    res.json(rows);
    return;
  }

  const likeQuery = `%${query}%`;
  const rows = db
    .prepare(
      `SELECT files.*, folders.name AS folder_name
       FROM files
       JOIN folders ON folders.id = files.folder_id
       WHERE files.display_name LIKE ? OR files.original_name LIKE ? OR files.path LIKE ?
       ORDER BY files.created_at DESC`
    )
    .all(likeQuery, likeQuery, likeQuery) as Array<ResearchFile & { folder_name: string }>;

  res.json(rows);
});

app.post("/api/prompts/regenerate", (_req, res) => {
  regeneratePrompts();
  res.json({ ok: true });
});

app.get("/api/prompts/brain", (_req, res) => {
  regeneratePrompts();
  res.json({
    indexPath: path.join(BRAIN_DIR, "brain.index.md"),
    promptPath: path.join(BRAIN_DIR, "brain.prompt.md"),
    index: readTextIfExists(path.join(BRAIN_DIR, "brain.index.md")),
    prompt: readTextIfExists(path.join(BRAIN_DIR, "brain.prompt.md"))
  });
});

app.get("/api/folders/:id/prompts", (req, res) => {
  const folder = getFolder(req.params.id);
  if (!folder) {
    res.status(404).json({ error: "Folder was not found." });
    return;
  }

  res.json({
    indexPath: path.join(folderRoot(folder), "folder.index.md"),
    promptPath: path.join(folderRoot(folder), "folder.prompt.md"),
    index: readTextIfExists(path.join(folderRoot(folder), "folder.index.md")),
    prompt: readTextIfExists(path.join(folderRoot(folder), "folder.prompt.md"))
  });
});

if (fs.existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
  });
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Codex Research Brain running at http://127.0.0.1:${PORT}`);
  console.log(`Brain files are stored in ${BRAIN_DIR}`);
});
