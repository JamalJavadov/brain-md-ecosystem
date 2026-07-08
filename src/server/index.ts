import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
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
const AUTO_GIT_SYNC = process.env.AUTO_GIT_SYNC !== "0";

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
  content_hash: string;
};

type ImportRecord = {
  id: string;
  original_name: string;
  source_path: string;
  document_title: string;
  document_summary: string;
  discarded_summary: string;
  segment_count: number;
  created_at: string;
  source_hash: string;
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

type FrontmatterValue = string | number | string[] | undefined;

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

function hashedStoredName(value: string, hash: string) {
  const parsed = path.parse(safeFilename(value));
  const shortHash = hash.slice(0, 8);
  if (new RegExp(`-${shortHash}$`).test(parsed.name)) return `${parsed.name}.md`;
  return `${parsed.name}-${shortHash}.md`;
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

type GitSyncResult = {
  ok: boolean;
  action: "disabled" | "skipped" | "pulled" | "committed-and-pushed" | "no-changes" | "failed";
  message: string;
  details?: string;
};

function runGit(args: string[], timeoutMs = 120_000) {
  const result = spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
    timeout: timeoutMs
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
}

function gitOutput(output: { stdout: string; stderr: string }) {
  return [output.stdout, output.stderr].filter(Boolean).join("\n").trim();
}

function gitIsAvailable(): { ok: true } | { ok: false; result: GitSyncResult } {
  if (!AUTO_GIT_SYNC) {
    return { ok: false, result: { ok: true, action: "disabled", message: "Automatic Git sync is disabled." } as GitSyncResult };
  }

  const insideRepo = runGit(["rev-parse", "--is-inside-work-tree"], 10_000);
  if (insideRepo.status !== 0 || insideRepo.stdout !== "true") {
    return {
      ok: false,
      result: {
        ok: false,
        action: "skipped",
        message: "Automatic Git sync was skipped because this folder is not a Git repository.",
        details: gitOutput(insideRepo)
      } as GitSyncResult
    };
  }

  return { ok: true };
}

function gitPullOnStartup(): GitSyncResult {
  const availability = gitIsAvailable();
  if (!availability.ok) return availability.result;

  const status = runGit(["status", "--porcelain"], 10_000);
  if (status.status !== 0) {
    return { ok: false, action: "failed", message: "Could not check Git status before startup pull.", details: gitOutput(status) };
  }

  if (status.stdout) {
    return {
      ok: true,
      action: "skipped",
      message: "Startup Git pull skipped because there are local uncommitted changes.",
      details: status.stdout
    };
  }

  const pull = runGit(["pull", "--ff-only"]);
  if (pull.status !== 0) {
    return { ok: false, action: "failed", message: "Startup Git pull failed.", details: gitOutput(pull) };
  }

  return { ok: true, action: "pulled", message: "Startup Git pull completed.", details: gitOutput(pull) };
}

function gitCommitAndPushVault(reason: string): GitSyncResult {
  const availability = gitIsAvailable();
  if (!availability.ok) return availability.result;

  const add = runGit(["add", "research-brain/vault/folders"]);
  if (add.status !== 0) {
    return { ok: false, action: "failed", message: "Could not stage Markdown vault files for Git sync.", details: gitOutput(add) };
  }

  const diff = runGit(["diff", "--cached", "--quiet", "--", "research-brain/vault/folders"], 10_000);
  if (diff.status === 0) {
    return { ok: true, action: "no-changes", message: "No Git-tracked Markdown vault changes needed pushing." };
  }

  const cleanReason = reason.replace(/\s+/g, " ").trim().slice(0, 80) || "vault update";
  const commit = runGit(["commit", "-m", `Sync research brain vault: ${cleanReason}`]);
  if (commit.status !== 0) {
    return { ok: false, action: "failed", message: "Could not commit Markdown vault changes.", details: gitOutput(commit) };
  }

  const firstPush = runGit(["push"]);
  if (firstPush.status === 0) {
    return { ok: true, action: "committed-and-pushed", message: "Markdown vault changes were committed and pushed.", details: gitOutput(firstPush) };
  }

  const pull = runGit(["pull", "--rebase"]);
  if (pull.status !== 0) {
    const abort = runGit(["rebase", "--abort"], 30_000);
    return {
      ok: false,
      action: "failed",
      message: "Git push was rejected and automatic rebase failed. Manual pull/rebase is needed.",
      details: [gitOutput(firstPush), gitOutput(pull), gitOutput(abort)].filter(Boolean).join("\n")
    };
  }

  const secondPush = runGit(["push"]);
  if (secondPush.status !== 0) {
    return { ok: false, action: "failed", message: "Git rebase completed, but push still failed.", details: gitOutput(secondPush) };
  }

  return {
    ok: true,
    action: "committed-and-pushed",
    message: "Markdown vault changes were committed, rebased with remote changes, and pushed.",
    details: [gitOutput(firstPush), gitOutput(pull), gitOutput(secondPush)].filter(Boolean).join("\n")
  };
}

function folderRoot(folder: Folder) {
  return path.join(FOLDERS_DIR, folder.slug);
}

function folderDocsDir(folder: Folder) {
  return path.join(folderRoot(folder), "docs");
}

function folderMetadataPath(folder: Folder) {
  return path.join(folderRoot(folder), "folder.md");
}

function repoRelativePath(filePath: string) {
  const relativePath = path.relative(ROOT_DIR, filePath);
  if (relativePath.startsWith("..")) return filePath;
  return relativePath.split(path.sep).join("/");
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

function normalizeMarkdownForDedup(content: string) {
  const withoutFrontmatter = content.replace(/^\uFEFF?---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n)?/, "");
  return withoutFrontmatter
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hashText(content: string) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

function contentHash(content: string) {
  const normalized = normalizeMarkdownForDedup(content);
  return hashText(normalized || content);
}

function splitFrontmatter(content: string) {
  const frontmatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n)?/);
  if (!frontmatter) return { lines: [] as string[], metadata: {} as Record<string, string>, body: content };

  const metadata: Record<string, string> = {};
  const lines = frontmatter[1].split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) metadata[match[1].trim().toLowerCase()] = match[2].trim();
  }

  return {
    lines,
    metadata,
    body: content.slice(frontmatter[0].length)
  };
}

function formatFrontmatterValue(value: Exclude<FrontmatterValue, undefined>) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function upsertMarkdownFrontmatter(content: string, updates: Record<string, FrontmatterValue>) {
  const keys = new Set(Object.keys(updates).map((key) => key.toLowerCase()));
  const parsed = splitFrontmatter(content);
  const keptLines = parsed.lines.filter((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):/);
    return !match || !keys.has(match[1].trim().toLowerCase());
  });
  const orderedKeys = [
    "source_import_id",
    "source_file",
    "source_section",
    "title",
    "summary",
    "importance",
    "tags",
    "keywords"
  ];
  const updateLines = orderedKeys
    .filter((key) => Object.prototype.hasOwnProperty.call(updates, key) && updates[key] !== undefined)
    .map((key) => `${key}: ${formatFrontmatterValue(updates[key] as Exclude<FrontmatterValue, undefined>)}`);
  const extraLines = Object.keys(updates)
    .filter((key) => !orderedKeys.includes(key) && updates[key] !== undefined)
    .map((key) => `${key}: ${formatFrontmatterValue(updates[key] as Exclude<FrontmatterValue, undefined>)}`);
  const lines = [...updateLines, ...extraLines, ...keptLines.filter((line) => line.trim())];

  return `---\n${lines.join("\n")}\n---\n\n${parsed.body.trimStart()}`;
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
    created_at TEXT NOT NULL,
    content_hash TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS imports (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    source_path TEXT NOT NULL,
    document_title TEXT NOT NULL,
    document_summary TEXT NOT NULL,
    discarded_summary TEXT NOT NULL DEFAULT '',
    segment_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    source_hash TEXT NOT NULL DEFAULT ''
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS file_search USING fts5(
    file_id UNINDEXED,
    display_name,
    original_name,
    folder_name,
    content_preview
  );
`);

function ensureTableColumn(table: "files" | "imports", name: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

function ensureFileColumn(name: string, definition: string) {
  ensureTableColumn("files", name, definition);
}

function ensureImportColumn(name: string, definition: string) {
  ensureTableColumn("imports", name, definition);
}

ensureFileColumn("summary", "TEXT NOT NULL DEFAULT ''");
ensureFileColumn("tags_json", "TEXT NOT NULL DEFAULT '[]'");
ensureFileColumn("keywords_json", "TEXT NOT NULL DEFAULT '[]'");
ensureFileColumn("importance", "INTEGER NOT NULL DEFAULT 3");
ensureFileColumn("source_import_id", "TEXT NOT NULL DEFAULT ''");
ensureFileColumn("source_section", "TEXT NOT NULL DEFAULT ''");
ensureFileColumn("content_hash", "TEXT NOT NULL DEFAULT ''");
ensureImportColumn("source_hash", "TEXT NOT NULL DEFAULT ''");

db.exec(`
  CREATE INDEX IF NOT EXISTS files_content_hash_idx ON files(content_hash);
  CREATE INDEX IF NOT EXISTS imports_source_hash_idx ON imports(source_hash);
`);

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

function getFileByContentHash(hash: string, exceptPath = "") {
  if (!hash) return undefined;
  return db
    .prepare("SELECT * FROM files WHERE content_hash = ? AND path != ? ORDER BY created_at ASC LIMIT 1")
    .get(hash, exceptPath) as ResearchFile | undefined;
}

function getImportBySourceHash(hash: string) {
  if (!hash) return undefined;
  return db
    .prepare("SELECT * FROM imports WHERE source_hash = ? ORDER BY created_at ASC LIMIT 1")
    .get(hash) as ImportRecord | undefined;
}

function filesForFolder(folderId: string) {
  return db
    .prepare("SELECT * FROM files WHERE folder_id = ? ORDER BY display_name ASC")
    .all(folderId) as ResearchFile[];
}

function filesForImport(importId: string) {
  return db
    .prepare("SELECT * FROM files WHERE source_import_id = ? ORDER BY created_at ASC")
    .all(importId) as ResearchFile[];
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
  writeFolderMetadata(folder);
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
  const parsedMetadata = parseMarkdownMetadata(params.displayName, params.content);
  const contentWithMetadata = upsertMarkdownFrontmatter(params.content, {
    title: params.displayName || parsedMetadata.title,
    summary: params.summary ?? parsedMetadata.summary,
    tags: params.tags ?? parsedMetadata.tags,
    keywords: params.keywords ?? parsedMetadata.keywords,
    importance: Math.max(1, Math.min(5, params.importance ?? parsedMetadata.importance)),
    source_import_id: params.sourceImportId || parsedMetadata.sourceImportId || undefined,
    source_file: params.originalName || parsedMetadata.sourceFile || undefined,
    source_section: params.sourceSection || parsedMetadata.sourceSection || undefined
  });
  const fileContentHash = contentHash(contentWithMetadata);
  const duplicate = getFileByContentHash(fileContentHash);
  if (duplicate) return duplicate;

  const storedName = uniqueStoredName(folder, hashedStoredName(params.displayName, fileContentHash));
  const destination = path.join(folderDocsDir(folder), storedName);
  writeText(destination, contentWithMetadata);

  const researchFile: ResearchFile = {
    id: randomUUID(),
    folder_id: folder.id,
    display_name: params.displayName,
    original_name: params.originalName,
    stored_name: storedName,
    path: destination,
    size_bytes: Buffer.byteLength(contentWithMetadata, "utf8"),
    created_at: nowIso(),
    summary: params.summary ?? parsedMetadata.summary,
    tags_json: JSON.stringify(params.tags ?? parsedMetadata.tags),
    keywords_json: JSON.stringify(params.keywords ?? parsedMetadata.keywords),
    importance: Math.max(1, Math.min(5, params.importance ?? parsedMetadata.importance)),
    source_import_id: params.sourceImportId ?? parsedMetadata.sourceImportId,
    source_section: params.sourceSection ?? parsedMetadata.sourceSection,
    content_hash: fileContentHash
  };

  db.prepare(
    `INSERT INTO files (
      id, folder_id, display_name, original_name, stored_name, path, size_bytes, created_at,
      summary, tags_json, keywords_json, importance, source_import_id, source_section, content_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    researchFile.source_section,
    researchFile.content_hash
  );
  refreshSearchForFile(researchFile, folder);
  return researchFile;
}

function ensureFolderFiles() {
  for (const folder of allFolders()) {
    ensureDir(folderDocsDir(folder));
    const metadataPath = folderMetadataPath(folder);
    const indexPath = path.join(folderRoot(folder), "folder.index.md");
    const promptPath = path.join(folderRoot(folder), "folder.prompt.md");
    if (!fs.existsSync(metadataPath)) writeFolderMetadata(folder);
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

function buildFolderMetadata(folder: Folder) {
  const description = folder.description || `Research related to ${folder.name}.`;
  return [
    "---",
    `title: ${JSON.stringify(folder.name)}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `# ${folder.name}`,
    "",
    description,
    ""
  ].join("\n");
}

function writeFolderMetadata(folder: Folder) {
  writeText(folderMetadataPath(folder), buildFolderMetadata(folder));
}

function uniqueNonEmpty(items: string[], limit = 12) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const clean = item.trim();
    const key = clean.toLowerCase();
    if (!clean || seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= limit) break;
  }
  return result;
}

function fileTerms(file: ResearchFile) {
  return uniqueNonEmpty(
    [
      file.display_name,
      file.summary,
      file.source_section,
      ...parseStringArray(file.tags_json),
      ...parseStringArray(file.keywords_json)
    ],
    30
  );
}

function folderTerms(files: ResearchFile[]) {
  return uniqueNonEmpty(
    files.flatMap((file) => [
      ...parseStringArray(file.tags_json),
      ...parseStringArray(file.keywords_json),
      file.source_section
    ]),
    18
  );
}

function evidenceType(file: ResearchFile) {
  const text = `${file.display_name} ${file.summary} ${file.source_section} ${parseStringArray(file.tags_json).join(" ")} ${parseStringArray(file.keywords_json).join(" ")}`.toLowerCase();
  if (/\b(checklist|quality|qc|review|audit|failure|mistake|fix|diagnostic)\b/.test(text)) return "quality gate / diagnostic";
  if (/\b(template|prompt|recipe|library|formula|blueprint)\b/.test(text)) return "template / reusable pattern";
  if (/\b(workflow|pipeline|process|production|step|operating model)\b/.test(text)) return "workflow / process";
  if (/\b(strategy|psychology|principle|framework|standard|model)\b/.test(text)) return "strategy / principles";
  if (/\b(metric|analytics|testing|experiment|platform)\b/.test(text)) return "platform / measurement";
  return "reference knowledge";
}

function priorityFilesForFolder(files: ResearchFile[], limit = 6) {
  return [...files]
    .sort((left, right) => {
      if (right.importance !== left.importance) return right.importance - left.importance;
      return right.summary.length - left.summary.length;
    })
    .slice(0, limit);
}

function folderRouteLabel(folder: Folder, files: ResearchFile[]) {
  const terms = folderTerms(files).slice(0, 8);
  const focus = terms.length ? terms.join(", ") : folder.description || folder.name;
  return `Use for ${folder.name.toLowerCase()} tasks involving ${focus}.`;
}

function relatedFoldersFor(folder: Folder, folders: Folder[], limit = 4) {
  const currentFiles = filesForFolder(folder.id);
  const currentTerms = new Set(
    uniqueNonEmpty(
      [
        folder.name,
        folder.description,
        ...folderTerms(currentFiles),
        ...currentFiles.flatMap((file) => fileTerms(file))
      ],
      80
    ).map((term) => term.toLowerCase())
  );

  const scored = folders
    .filter((candidate) => candidate.id !== folder.id)
    .map((candidate) => {
      const candidateFiles = filesForFolder(candidate.id);
      const candidateTerms = uniqueNonEmpty(
        [
          candidate.name,
          candidate.description,
          ...folderTerms(candidateFiles),
          ...candidateFiles.flatMap((file) => fileTerms(file))
        ],
        80
      );
      const score = candidateTerms.reduce((count, term) => count + (currentTerms.has(term.toLowerCase()) ? 1 : 0), 0);
      return { folder: candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.folder);

  return scored;
}

function buildFolderIndex(folder: Folder) {
  const files = filesForFolder(folder.id);
  const priorityFiles = priorityFilesForFolder(files);
  const routingTerms = folderTerms(files).slice(0, 12);
  const relatedFolders = relatedFoldersFor(folder, allFolders());
  const lines = [
    `# ${folder.name} - Folder Index`,
    "",
    `Folder path: \`${repoRelativePath(folderRoot(folder))}\``,
    "",
    "## Purpose",
    "",
    folder.description || "No description has been added yet.",
    "",
    "## Routing Guide",
    "",
    `Use this folder when the task needs ${folder.name.toLowerCase()} research, standards, examples, warnings, workflows, or reusable prompt patterns.`,
    routingTerms.length
      ? `Strong routing terms: ${routingTerms.join(", ")}.`
      : "Strong routing terms have not been generated yet.",
    "",
    "Do not use this folder as the only context when the task clearly needs adjacent disciplines such as platform strategy, scripting, visual quality, sound, material realism, implementation, or delivery QA.",
    "",
    "## Best Entry Points",
    ""
  ];

  if (priorityFiles.length === 0) {
    lines.push("No priority files are available yet.");
  } else {
    for (const file of priorityFiles) {
      lines.push(`- ${file.display_name} (${file.importance}/5, ${evidenceType(file)})`);
      lines.push(`  - Path: \`${repoRelativePath(file.path)}\``);
      lines.push(`  - Use when: ${file.summary || "The task overlaps with this file's title, tags, or source section."}`);
    }
  }

  lines.push("");
  lines.push("## Suggested Reading Order");
  lines.push("");

  if (priorityFiles.length === 0) {
    lines.push("No reading order is available yet.");
  } else {
    priorityFiles.forEach((file, index) => {
      lines.push(`${index + 1}. ${file.display_name} - ${evidenceType(file)}.`);
    });
  }

  lines.push("");
  lines.push("## Related Folders");
  lines.push("");

  if (relatedFolders.length === 0) {
    lines.push("No strongly related folders were detected from current tags and keywords.");
  } else {
    for (const relatedFolder of relatedFolders) {
      lines.push(`- ${relatedFolder.name}: \`${repoRelativePath(path.join(folderRoot(relatedFolder), "folder.index.md"))}\``);
    }
  }

  lines.push(
    "",
    "## Files",
    ""
  );

  if (files.length === 0) {
    lines.push("No Markdown files are stored in this folder yet.");
  } else {
    for (const file of files) {
      const tags = parseStringArray(file.tags_json);
      const keywords = parseStringArray(file.keywords_json);
      lines.push(`- ${file.display_name}`);
      lines.push(`  - Path: \`${repoRelativePath(file.path)}\``);
      lines.push(`  - Original file: \`${file.original_name}\``);
      if (file.summary) lines.push(`  - Summary: ${file.summary}`);
      if (tags.length) lines.push(`  - Tags: ${tags.join(", ")}`);
      if (keywords.length) lines.push(`  - Keywords: ${keywords.join(", ")}`);
      lines.push(`  - Importance: ${file.importance}/5`);
      lines.push(`  - Evidence type: ${evidenceType(file)}`);
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
            `- ${file.display_name} (importance ${file.importance}/5): ${repoRelativePath(file.path)}${file.summary ? `\n  Summary: ${file.summary}` : ""}`
        );

  return [
    `# ${folder.name} - Codex Prompt`,
    "",
    "Use this prompt when the current task should be guided by this research folder.",
    "",
    "## Instructions For Codex",
    "",
    `You are working with the local research folder named "${folder.name}".`,
    `Folder path: ${repoRelativePath(folderRoot(folder))}`,
    `Folder index path: ${repoRelativePath(path.join(folderRoot(folder), "folder.index.md"))}`,
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
    `Brain root: \`${repoRelativePath(BRAIN_DIR)}\``,
    "",
    "Use this index as the high-level routing map for the local research vault.",
    "Start here, choose a small set of candidate folders, then open their folder indexes before reading specific Markdown files.",
    "",
    "## How To Route",
    "",
    "1. Identify the user's real deliverable, platform, audience, medium, quality bar, and constraints.",
    "2. Choose direct folders that match the deliverable.",
    "3. Add adjacent folders only when they can materially improve the result.",
    "4. Open each candidate folder index and read the best entry point files first.",
    "5. Stop gathering context once the selected files are enough to answer or build confidently.",
    "",
    "## Common Routing Patterns",
    "",
    "- YouTube script or educational video: start with YouTube Educational Scriptwriting, then add YouTube Video Packaging, Short Form Video Growth Strategy, 2D Educational Animation, sound, color, or motion folders if the deliverable needs them.",
    "- YouTube titles, thumbnails, descriptions, metadata, or CTR strategy: start with YouTube Video Packaging, then add scriptwriting or viewer psychology folders when promise, retention, or audience fit matters.",
    "- Short-form reels, TikToks, or Shorts: start with Short Form Video Growth Strategy, then add product, jewelry, sound, lighting, material realism, or platform-specific folders as needed.",
    "- Product video or AI commercial visuals: start with Product Video Material Realism, Product Video Lighting Standard, Professional 3D Motion Visuals, Color Design, and Premium Product Sound Design.",
    "- Jewelry or Ring for Baku content: start with AI Jewelry Product Photography, then add material realism, lighting, short-form strategy, and commerce trust folders.",
    "- Remotion or code-generated video: start with Codex Remotion Video Production, then add motion, UI/UX, sound, color, material, and QA folders based on the scene.",
    "- UI/UX or front-end implementation: start with Front End UI UX Design, then add product, platform, or motion folders only if relevant.",
    "",
    "## Folders",
    ""
  ];

  for (const folder of folders) {
    const folderFiles = filesForFolder(folder.id);
    const priorityFiles = priorityFilesForFolder(folderFiles, 5);
    const routingTerms = folderTerms(folderFiles).slice(0, 10);
    lines.push(`### ${folder.name}`);
    lines.push("");
    lines.push(`- Slug: \`${folder.slug}\``);
    lines.push(`- Folder path: \`${repoRelativePath(folderRoot(folder))}\``);
    lines.push(`- Folder index: \`${repoRelativePath(path.join(folderRoot(folder), "folder.index.md"))}\``);
    lines.push(`- Folder prompt: \`${repoRelativePath(path.join(folderRoot(folder), "folder.prompt.md"))}\``);
    lines.push(`- Purpose: ${folder.description || "No description has been added yet."}`);
    lines.push(`- Route when: ${folderRouteLabel(folder, folderFiles)}`);
    if (routingTerms.length) lines.push(`- Routing terms: ${routingTerms.join(", ")}`);
    lines.push(`- File count: ${folderFiles.length}`);
    if (priorityFiles.length) {
      lines.push("- Priority knowledge:");
      for (const file of priorityFiles) {
        lines.push(
          `  - ${file.display_name} (${file.importance}/5, ${evidenceType(file)}): ${file.summary || "No summary available."}`
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
    "Your job is not to answer from memory first. Your job is to route the user's task through the vault, open the right local files, extract the useful standards, and then answer or implement using that evidence.",
    "",
    "## Vault Identity",
    "",
    `- Brain root: ${repoRelativePath(BRAIN_DIR)}`,
    `- Global index: ${repoRelativePath(path.join(BRAIN_DIR, "brain.index.md"))}`,
    `- Global prompt: ${repoRelativePath(path.join(BRAIN_DIR, "brain.prompt.md"))}`,
    `- Vault folders root: ${repoRelativePath(FOLDERS_DIR)}`,
    `- Indexed folders: ${folders.length}`,
    `- Indexed Markdown files: ${totalFiles}`,
    "",
    "## Non-Negotiable Operating Rules",
    "",
    "1. Treat this research vault as the primary local knowledge source whenever the user's task overlaps with the saved research index.",
    "2. Never answer from this prompt alone when vault context is relevant. First open and read the relevant local indexes and Markdown files.",
    "3. Start with the global index for a compact overview, then read relevant folder indexes, then read only the specific Markdown files needed for the task.",
    "4. Route by intent, not only by keywords. Infer the user's real deliverable, audience, platform, medium, quality bar, constraints, and hidden support needs.",
    "5. Select both direct folders and useful adjacent folders. A YouTube task may need scriptwriting, packaging, retention, thumbnail, color, sound, motion, or production workflow research depending on the request.",
    "6. Use folder purposes, summaries, tags, keywords, source sections, importance scores, and file paths to decide what to read.",
    "7. Do not read every file by default. Read enough evidence to answer confidently, then stop gathering context.",
    "8. Treat vault material as saved standards, patterns, examples, heuristics, and warning signs. Adapt it to the current project instead of copying rules mechanically.",
    "9. If the task spans multiple topics, combine direct and supporting files. Resolve contradictions explicitly instead of blending them silently.",
    "10. If no indexed folder or file matches the task or its useful adjacent topics, say the research brain does not currently contain matching context and continue with general reasoning only if the user wants that.",
    "11. Preserve the user's intent and the saved research constraints. Do not invent vault facts that are not present in the files you read.",
    "12. Mention local file paths when they would help the user verify where an answer came from.",
    "13. Do not modify, move, delete, or regenerate vault files unless the user explicitly asks you to maintain the research brain.",
    "",
    "## Retrieval Workflow",
    "",
    "Use this workflow for every task that may need the vault:",
    "",
    "1. Read the user's task and extract: objective, deliverable, audience, platform, medium, constraints, quality bar, and keywords.",
    `2. Open the global index: ${repoRelativePath(path.join(BRAIN_DIR, "brain.index.md"))}`,
    "3. Build a short candidate list of folders. Include obvious matches and adjacent folders that could materially improve the result.",
    "4. Open each candidate folder's `folder.index.md` for file-level routing.",
    "5. Choose the exact Markdown files whose summaries, tags, keywords, examples, source sections, checklists, or workflows can help the current deliverable.",
    "6. Read those files deeply enough to extract the relevant standards, patterns, constraints, warnings, examples, and reusable templates.",
    "7. Ignore unrelated files once enough evidence is gathered. Keep context focused.",
    "8. Synthesize the selected research into project-specific guidance, code, prompts, creative direction, or production decisions.",
    "9. Before finalizing, check whether the answer respects the vault's examples, workflows, warnings, constraints, and decisions.",
    "",
    "## Routing Heuristics",
    "",
    "- If the task asks for a script, inspect scriptwriting, viewer psychology, retention, and platform-format folders before writing.",
    "- If the task asks for YouTube titles, thumbnails, descriptions, metadata, or packaging, inspect YouTube packaging and any adjacent script or audience folders.",
    "- If the task asks for short-form content, inspect short-form growth plus any domain folders for the product, audience, visual style, sound, or platform.",
    "- If the task asks for product video, inspect material realism, lighting, professional 3D/motion, color, sound, and product-specific folders.",
    "- If the task asks for jewelry visuals or Ring for Baku content, inspect jewelry photography plus material realism, lighting, short-form, and trust/content strategy as needed.",
    "- If the task asks for Remotion or code-generated video, inspect Codex Remotion production plus motion, design, material, audio, and QA folders as needed.",
    "- If the task asks for UI, UX, app screens, landing pages, or front-end implementation, inspect front-end UI/UX design and any relevant product or media folders.",
    "- If the task asks for a review, audit, quality bar, or improvement plan, prioritize checklists, failure modes, standards, and QC files.",
    "",
    "## Evidence Discipline",
    "",
    "- Keep a small mental list of the files you actually used.",
    "- Do not cite files you did not open.",
    "- Prefer concrete instructions from the vault over generic best practices.",
    "- When vault guidance conflicts with the user's request, explain the tradeoff and follow the user's explicit priority unless it would break a saved non-negotiable standard.",
    "- If a task requires current external facts, verify them separately instead of relying on stale vault material.",
    "",
    "## Response Behavior",
    "",
    "- Answer in the user's language unless they ask otherwise.",
    "- Be direct and practical. Convert research into the user's deliverable, not into a long literature summary.",
    "- When useful, include a short `Used research` section with local file paths.",
    "- If implementation is requested, use the vault research to guide the implementation and then verify the result normally.",
    "",
    "## Fast Local Commands",
    "",
    "When shell access is available, these commands are useful:",
    "",
    `- List vault files: \`rg --files ${JSON.stringify(repoRelativePath(FOLDERS_DIR))}\``,
    `- Search research text: \`rg -n \"<topic or keyword>\" ${JSON.stringify(repoRelativePath(FOLDERS_DIR))}\``,
    `- Open global index: \`sed -n '1,220p' ${JSON.stringify(repoRelativePath(path.join(BRAIN_DIR, "brain.index.md")))}\``,
    "",
    "## Retrieval Map",
    "",
    "Keep this main prompt small. Do not expect the folder map to be embedded here.",
    `For routing, open the global index: ${repoRelativePath(path.join(BRAIN_DIR, "brain.index.md"))}`,
    "That index contains folder purposes, priority knowledge, and file-level entry points.",
    "",
    "When a task mentions a topic directly, search the vault before choosing files:",
    "",
    `- \`rg -n "<topic or keyword>" ${JSON.stringify(repoRelativePath(FOLDERS_DIR))}\``,
    "",
    "Use these steps instead of loading the whole vault into context:",
    "",
    "1. Read `brain.index.md` only far enough to identify likely folders.",
    "2. Open only the matching `folder.index.md` files.",
    "3. Open only the Markdown files needed for the current deliverable.",
    "4. Stop reading when the selected files are enough to answer or build confidently.",
    "",
    "Do not copy folder summaries, file summaries, tags, or keywords into this main prompt. They belong in `brain.index.md` and `folder.index.md` so this prompt stays stable as the vault grows.",
    ""
  ];

  if (folders.length === 0) {
    lines.push("No research folders have been indexed yet.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Final Handoff Instruction");
  lines.push("");
  lines.push("Before answering the user, route the task through `brain.index.md`, open the relevant local indexes and Markdown files, and base the final work on the selected research. This prompt is a router, not a container for vault knowledge.");
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
  const { metadata, body } = splitFrontmatter(content);

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

function parseFolderMetadataFromDisk(slug: string, folderPath: string, docs: string[]) {
  const metadataPath = path.join(folderPath, "folder.md");
  const metadataContent = readTextIfExists(metadataPath);
  if (metadataContent) {
    const parsed = splitFrontmatter(metadataContent);
    const heading = parsed.body.match(/^#\s+(.+)$/m)?.[1]?.trim();
    const firstParagraph =
      parsed.body
        .replace(/^#.*$/gm, "")
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .find(Boolean) ?? "";
    const name = (parsed.metadata.title || heading || titleFromSlug(slug)).replace(/^["']|["']$/g, "");
    const description = (parsed.metadata.description || firstParagraph || `Research related to ${name}.`).replace(
      /^["']|["']$/g,
      ""
    );
    return { name, description };
  }

  const indexPath = path.join(folderPath, "folder.index.md");
  const indexContent = readTextIfExists(indexPath);
  const heading = indexContent.match(/^#\s+(.+?)(?:\s+-\s+Folder Index)?\s*$/m)?.[1]?.trim();
  const purpose = indexContent
    .match(/## Purpose\s+([\s\S]*?)(?=\n## |\s*$)/)?.[1]
    ?.trim()
    .replace(/^No description has been added yet\.$/, "");
  const firstMetadata = docs[0] ? parseMarkdownMetadata(docs[0], readTextIfExists(docs[0])) : undefined;
  const name = heading || titleFromSlug(slug);
  const description = purpose || firstMetadata?.summary || `Research related to ${name}.`;

  return { name, description };
}

function syncVaultFromDisk(importId = "", originalName = "") {
  ensureDir(FOLDERS_DIR);
  const beforePaths = new Set(allFiles().map((file) => file.path));
  const createdFolderIds = new Set<string>();
  const reusedFiles = new Map<string, ResearchFile>();
  const skippedDuplicatePaths: string[] = [];
  const folders = fs
    .readdirSync(FOLDERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."));
  const diskFolderSlugs = new Set(folders.map((entry) => slugify(entry.name)));

  for (const folder of allFolders()) {
    if (diskFolderSlugs.has(folder.slug)) continue;
    for (const file of filesForFolder(folder.id)) {
      db.prepare("DELETE FROM file_search WHERE file_id = ?").run(file.id);
    }
    db.prepare("DELETE FROM files WHERE folder_id = ?").run(folder.id);
    db.prepare("DELETE FROM folders WHERE id = ?").run(folder.id);
  }

  for (const entry of folders) {
    const slug = slugify(entry.name);
    const folderPath = path.join(FOLDERS_DIR, entry.name);
    const docsDir = path.join(folderPath, "docs");
    const docs = markdownFilesIn(docsDir);
    if (docs.length === 0) continue;

    let folder = getFolderBySlug(slug);
    const folderMetadata = parseFolderMetadataFromDisk(slug, folderPath, docs);
    if (!folder) {
      folder = createFolderRecord(folderMetadata.name, folderMetadata.description);
      createdFolderIds.add(folder.id);
      if (folder.slug !== slug) {
        const correctedFolder: Folder = { ...folder, slug };
        db.prepare("UPDATE folders SET slug = ? WHERE id = ?").run(slug, folder.id);
        folder = correctedFolder;
      }
    } else if (folder.name !== folderMetadata.name || folder.description !== folderMetadata.description) {
      const updatedFolder: Folder = { ...folder, name: folderMetadata.name, description: folderMetadata.description };
      db.prepare("UPDATE folders SET name = ?, description = ? WHERE id = ?").run(
        updatedFolder.name,
        updatedFolder.description,
        updatedFolder.id
      );
      folder = updatedFolder;
    }

    ensureDir(folderDocsDir(folder));
    for (let docPath of docs) {
      const content = readTextIfExists(docPath);
      const fileContentHash = contentHash(content);
      const metadata = parseMarkdownMetadata(docPath, content);
      const existing = db.prepare("SELECT * FROM files WHERE path = ?").get(docPath) as ResearchFile | undefined;
      const duplicate = getFileByContentHash(fileContentHash, docPath);

      if (duplicate) {
        if (fs.existsSync(docPath)) fs.rmSync(docPath);
        skippedDuplicatePaths.push(docPath);
        reusedFiles.set(duplicate.id, duplicate);
        if (existing) {
          db.prepare("DELETE FROM file_search WHERE file_id = ?").run(existing.id);
          db.prepare("DELETE FROM files WHERE id = ?").run(existing.id);
        }
        continue;
      }

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
          source_section: metadata.sourceSection || existing.source_section,
          content_hash: fileContentHash
        };
        db.prepare(
          `UPDATE files
           SET display_name = ?, original_name = ?, size_bytes = ?, summary = ?, tags_json = ?,
               keywords_json = ?, importance = ?, source_import_id = ?, source_section = ?, content_hash = ?
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
          updated.content_hash,
          updated.id
        );
        refreshSearchForFile(updated, folder);
      } else {
        if (importId) {
          const requestedName = metadata.title || path.parse(docPath).name;
          const storedNameWithHash = uniqueStoredName(folder, hashedStoredName(requestedName, fileContentHash), docPath);
          const hashedPath = path.join(folderDocsDir(folder), storedNameWithHash);
          if (hashedPath !== docPath) {
            fs.renameSync(docPath, hashedPath);
            docPath = hashedPath;
          }
        }

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
          source_section: metadata.sourceSection,
          content_hash: fileContentHash
        };
        db.prepare(
          `INSERT INTO files (
            id, folder_id, display_name, original_name, stored_name, path, size_bytes, created_at,
            summary, tags_json, keywords_json, importance, source_import_id, source_section, content_hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
          researchFile.source_section,
          researchFile.content_hash
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

  const removedEmptyFolders: string[] = [];
  for (const folderId of createdFolderIds) {
    const folder = getFolder(folderId);
    if (!folder || filesForFolder(folder.id).length > 0) continue;
    if (markdownFilesIn(folderDocsDir(folder)).length > 0) continue;
    db.prepare("DELETE FROM folders WHERE id = ?").run(folder.id);
    fs.rmSync(folderRoot(folder), { recursive: true, force: true });
    removedEmptyFolders.push(folderRoot(folder));
  }

  regeneratePrompts();
  const indexedFiles = allFiles().filter((file) => !beforePaths.has(file.path) || (importId && file.source_import_id === importId));
  const files = new Map<string, ResearchFile>();
  for (const file of indexedFiles) files.set(file.id, file);
  for (const file of reusedFiles.values()) files.set(file.id, file);

  return {
    files: [...files.values()],
    createdFiles: indexedFiles.filter((file) => !beforePaths.has(file.path)),
    reusedFiles: [...reusedFiles.values()],
    skippedDuplicatePaths,
    removedEmptyFolders
  };
}

function backfillContentHashes() {
  for (const file of allFiles()) {
    if (file.content_hash) continue;
    const content = readTextIfExists(file.path);
    if (!content) continue;
    db.prepare("UPDATE files SET content_hash = ? WHERE id = ?").run(contentHash(content), file.id);
  }
}

function backfillSourceHashes() {
  const imports = db.prepare("SELECT * FROM imports WHERE source_hash = ''").all() as ImportRecord[];
  for (const importRecord of imports) {
    const content = readTextIfExists(importRecord.source_path);
    if (!content) continue;
    db.prepare("UPDATE imports SET source_hash = ? WHERE id = ?").run(contentHash(content), importRecord.id);
  }
}

function filesForImportRecord(importRecord: ImportRecord) {
  const directFiles = filesForImport(importRecord.id);
  if (directFiles.length > 0) return directFiles;

  const manifestPath = path.join(path.dirname(importRecord.source_path), `${importRecord.id}.manifest.json`);
  try {
    const manifest = JSON.parse(readTextIfExists(manifestPath)) as { generatedFiles?: Array<{ fileId?: string }> };
    const files = (manifest.generatedFiles ?? [])
      .map((entry) => (entry.fileId ? getFile(entry.fileId) : undefined))
      .filter((file): file is ResearchFile => Boolean(file));
    return files;
  } catch {
    return [];
  }
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
    `Global brain index: ${path.join(BRAIN_DIR, "brain.index.md")}`,
    "",
    "Existing folders you may reuse:",
    JSON.stringify(folders, null, 2),
    "",
    "Required workflow:",
    "1. Read the source file deeply.",
    "2. Read the global brain index and any relevant existing folder indexes before deciding where to write.",
    "3. Identify valuable knowledge and remove duplicated, outdated, navigational, empty, or low-value text.",
    "4. If a useful knowledge unit is already present in the vault, do not create another copy of it.",
    "5. Split only when it creates genuinely useful standalone knowledge units. If the whole document is coherent, keep it as one file.",
    "6. If headings are weak or missing, infer sections semantically from topics, workflows, examples, warnings, decisions, and constraints.",
    "7. Reuse an existing folder slug when the topic already fits that folder. Do not create a near-duplicate folder with a renamed version of the same subject.",
    "8. Otherwise create a new English slug under the vault folder root.",
    "9. For every useful non-duplicate knowledge unit, create exactly one Markdown file at:",
    "   research-brain/vault/folders/<folder-slug>/docs/<clean-file-slug>.md",
    "10. Use only lowercase kebab-case slugs for folder and file names.",
    "11. Do not edit brain.index.md, brain.prompt.md, folder.index.md, folder.prompt.md, brain.sqlite, package files, source code, or the original uploaded file.",
    "12. Do not create Inbox or Youtube folders unless the source content truly requires those topics.",
    "13. Write metadata for retrieval quality, not decoration. Codex will later use your metadata to decide which files to open.",
    "",
    "Importance scoring rubric:",
    "- 5 = foundational standard, core workflow, reusable operating model, or source that should usually be read first for this topic.",
    "- 4 = strong practical guide, checklist, template, or high-value playbook for common tasks.",
    "- 3 = useful supporting reference, examples, platform notes, or narrower workflow.",
    "- 2 = niche detail, secondary context, or special-case guidance.",
    "- 1 = low-priority reference that is still worth preserving but rarely the first file to read.",
    "",
    "Metadata quality rules:",
    "- `title` must be a clear standalone English title, not a copied source heading if it is vague.",
    "- `summary` must explain what decision, task, or deliverable this file helps with.",
    "- `tags` should be broad routing labels such as platform, medium, discipline, asset type, or workflow category.",
    "- `keywords` should include exact phrases a future user might mention when looking for this knowledge.",
    "- `routing_use` should say when Codex should open this file.",
    "- `routing_avoid` should say when this file is not enough or should not be the main context.",
    "- `evidence_type` should be one of: strategy, workflow, checklist, template, failure-modes, platform-reference, examples, quality-standard.",
    "",
    "Every created Markdown file must start with this YAML-style frontmatter. Replace the example values with accurate values for the specific knowledge unit:",
    "---",
    `source_import_id: ${JSON.stringify(importId)}`,
    `source_file: ${JSON.stringify(originalName)}`,
    "source_section: \"Original section or inferred topic\"",
    "title: \"Clean standalone English title\"",
    "summary: \"Concise English summary of the useful knowledge and the task it supports\"",
    "importance: 4",
    "evidence_type: \"workflow\"",
    "routing_use: \"Open this file when the user needs the specific decisions, standards, workflow, checklist, or templates covered here.\"",
    "routing_avoid: \"Do not use this file as the only source when the task also needs adjacent strategy, platform, visual, sound, implementation, or QA context.\"",
    "tags: [\"broad-routing-tag\", \"workflow-category\"]",
    "keywords: [\"exact search phrase\", \"specific concept\", \"task wording\"]",
    "---",
    "",
    "Then write polished Markdown content with a clear H1 and useful subsections.",
    "Preserve factual details, constraints, examples, commands, code snippets, workflows, warnings, and decisions from the source.",
    "Do not hallucinate or add unsupported claims.",
    "Include a short `When to use this file` section near the top when the routing value is not obvious from the title.",
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

function buildSegmentResults(files: ResearchFile[]) {
  const usedFolders = new Map<string, Folder>();
  const segmentResults = files.map((importedFile) => {
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

  return {
    usedFolders,
    segmentResults
  };
}

const STARTUP_GIT_SYNC_RESULT = gitPullOnStartup();
console.log(STARTUP_GIT_SYNC_RESULT.message);
if (STARTUP_GIT_SYNC_RESULT.details) console.log(STARTUP_GIT_SYNC_RESULT.details);

syncVaultFromDisk();
backfillContentHashes();
backfillSourceHashes();
cleanupLegacyEmptyFolders();
regeneratePrompts();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, brainDir: BRAIN_DIR, startupGitSync: STARTUP_GIT_SYNC_RESULT });
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
  writeFolderMetadata(folder);
  regeneratePrompts();
  const gitSync = gitCommitAndPushVault(`create folder ${folder.name}`);
  res.status(201).json({ ...folder, gitSync });
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
  writeFolderMetadata(updatedFolder);
  for (const file of filesForFolder(folder.id)) {
    refreshSearchForFile(file, updatedFolder);
  }
  regeneratePrompts();
  const gitSync = gitCommitAndPushVault(`update folder ${updatedFolder.name}`);
  res.json({ ...updatedFolder, gitSync });
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
  const gitSync = gitCommitAndPushVault(`delete folder ${folder.name}`);
  res.json({ ok: true, gitSync });
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

  const content = file.buffer.toString("utf8");
  const duplicate = getFileByContentHash(contentHash(content));
  if (duplicate) {
    res.status(200).json(duplicate);
    return;
  }

  const folder = getFolder(String(req.body.folderId ?? "")) ?? createFolderRecord("Imported Research", "Manually imported research files.");
  const displayName = String(req.body.displayName ?? "").trim() || path.parse(file.originalname).name;
  const researchFile = createFileRecord(folder, {
    displayName,
    originalName: file.originalname,
    content
  });
  regeneratePrompts();
  const gitSync = gitCommitAndPushVault(`manual import ${file.originalname}`);
  res.status(201).json({ ...researchFile, gitSync });
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

  const content = file.buffer.toString("utf8");
  const sourceHash = contentHash(content);
  const existingImport = getImportBySourceHash(sourceHash);
  if (existingImport) {
    const existingFiles = filesForImportRecord(existingImport);
    if (existingFiles.length > 0) {
      const { usedFolders, segmentResults } = buildSegmentResults(existingFiles);
      const documentTitle = existingImport.document_title || path.parse(file.originalname).name;
      res.status(200).json({
        ok: true,
        duplicate: true,
        importId: existingImport.id,
        duplicateOfImportId: existingImport.id,
        plan: {
          documentTitle,
          documentSummary: `This Markdown source was already imported as ${existingImport.original_name}. Existing knowledge files were reused instead of creating copies.`,
          discardedSummary: "The uploaded source matched an existing import hash, so Codex was not run again.",
          confidence: 1
        },
        folders: [...usedFolders.values()],
        files: existingFiles,
        segments: segmentResults,
        createdFileCount: 0,
        reusedFileCount: existingFiles.length,
        skippedDuplicateFileCount: existingFiles.length,
        structure: {
          brainDir: BRAIN_DIR,
          sourcePath: existingImport.source_path,
          manifestPath: path.join(path.dirname(existingImport.source_path), `${existingImport.id}.manifest.json`)
        }
      });
      return;
    }
  }

  const importId = randomUUID();
  const pendingDir = path.join(IMPORTS_DIR, "pending");
  ensureDir(pendingDir);
  const pendingPath = path.join(pendingDir, `${importId}-${safeFilename(file.originalname)}`);
  writeText(pendingPath, content);

  try {
    await runCodexFileWriter(pendingPath, file.originalname, importId);
    const archiveDir = path.join(IMPORTS_DIR, "archive");
    ensureDir(archiveDir);
    const archivePath = path.join(archiveDir, `${importId}-${safeFilename(file.originalname)}`);
    fs.renameSync(pendingPath, archivePath);

    const syncResult = syncVaultFromDisk(importId, file.originalname);
    const importedFiles = syncResult.files;
    if (importedFiles.length === 0) {
      throw new Error("Codex finished but did not create any Markdown knowledge files in the vault.");
    }

    const { usedFolders, segmentResults } = buildSegmentResults(importedFiles);

    const documentTitle = path.parse(file.originalname).name;
    const createdCount = syncResult.createdFiles.length;
    const reusedCount = syncResult.reusedFiles.length;
    const documentSummary =
      reusedCount > 0
        ? `Codex organized ${createdCount} new Markdown knowledge unit${createdCount === 1 ? "" : "s"} from ${file.originalname} and reused ${reusedCount} existing duplicate-free unit${reusedCount === 1 ? "" : "s"}.`
        : `Codex organized ${importedFiles.length} Markdown knowledge unit${importedFiles.length === 1 ? "" : "s"} from ${file.originalname}.`;

    db.prepare(
      `INSERT INTO imports (
        id, original_name, source_path, document_title, document_summary,
        discarded_summary, segment_count, created_at, source_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      importId,
      file.originalname,
      archivePath,
      documentTitle,
      documentSummary,
      syncResult.skippedDuplicatePaths.length > 0
        ? `Skipped ${syncResult.skippedDuplicatePaths.length} duplicate Markdown file${syncResult.skippedDuplicatePaths.length === 1 ? "" : "s"} during vault indexing.`
        : "Codex removed low-value or duplicated material during direct file creation when appropriate.",
      importedFiles.length,
      nowIso(),
      sourceHash
    );

    const manifestPath = path.join(archiveDir, `${importId}.manifest.json`);
    writeText(
      manifestPath,
      JSON.stringify(
        {
          importId,
          originalName: file.originalname,
          archivePath,
          generatedFiles: segmentResults,
          createdFileCount: createdCount,
          reusedFileCount: reusedCount,
          skippedDuplicatePaths: syncResult.skippedDuplicatePaths,
          removedEmptyFolders: syncResult.removedEmptyFolders
        },
        null,
        2
      )
    );

    regeneratePrompts();
    const gitSync = gitCommitAndPushVault(`automatic import ${file.originalname}`);
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
      createdFileCount: createdCount,
      reusedFileCount: reusedCount,
      skippedDuplicateFileCount: syncResult.skippedDuplicatePaths.length,
      gitSync,
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
  const gitSync = gitCommitAndPushVault(`move file ${movedFile.display_name}`);
  res.json({ ...movedFile, gitSync });
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

  const updatedContent = upsertMarkdownFrontmatter(readTextIfExists(destination), { title: displayName });
  writeText(destination, updatedContent);

  const renamedFile: ResearchFile = {
    ...file,
    display_name: displayName,
    stored_name: storedName,
    path: destination,
    size_bytes: Buffer.byteLength(updatedContent, "utf8"),
    content_hash: contentHash(updatedContent)
  };
  db.prepare("UPDATE files SET display_name = ?, stored_name = ?, path = ?, size_bytes = ?, content_hash = ? WHERE id = ?").run(
    renamedFile.display_name,
    renamedFile.stored_name,
    renamedFile.path,
    renamedFile.size_bytes,
    renamedFile.content_hash,
    renamedFile.id
  );
  refreshSearchForFile(renamedFile, folder);
  regeneratePrompts();
  const gitSync = gitCommitAndPushVault(`rename file ${renamedFile.display_name}`);
  res.json({ ...renamedFile, gitSync });
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
  const gitSync = gitCommitAndPushVault(`delete file ${file.display_name}`);
  res.json({ ok: true, gitSync });
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
