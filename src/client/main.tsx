import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type Folder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  is_inbox: number;
  path: string;
  promptPath: string;
  indexPath: string;
  files: ResearchFile[];
};

type ResearchFile = {
  id: string;
  folder_id: string;
  display_name: string;
  original_name: string;
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

type FileDetail = ResearchFile & {
  content: string;
};

type StructureResponse = {
  brainDir: string;
  brainPromptPath: string;
  brainIndexPath: string;
  folders: Folder[];
};

type GitSyncResult = {
  ok: boolean;
  action: "disabled" | "skipped" | "pulled" | "committed-and-pushed" | "no-changes" | "failed";
  message: string;
  details?: string;
};

type ImportResult = {
  ok: boolean;
  importId: string;
  duplicate?: boolean;
  duplicateOfImportId?: string;
  createdFileCount?: number;
  reusedFileCount?: number;
  skippedDuplicateFileCount?: number;
  plan: {
    documentTitle: string;
    documentSummary: string;
    discardedSummary: string;
    confidence: number;
  };
  folders: Folder[];
  files: ResearchFile[];
  gitSync?: GitSyncResult;
  segments: Array<{
    title: string;
    summary: string;
    folderName: string;
    folderSlug: string;
    tags: string[];
    keywords: string[];
    importance: number;
    fileId: string;
    filePath: string;
  }>;
  structure: {
    brainDir: string;
    sourcePath: string;
    manifestPath: string;
  };
};

type PromptResponse = {
  indexPath: string;
  promptPath: string;
  index: string;
  prompt: string;
};

type ModuleName = "import" | "structure";
type PromptTab = "folderPrompt" | "brainPrompt" | "folderIndex";
type CopyState = "idle" | "copying" | "copied";
type QueueStatus = "pending" | "importing" | "done" | "failed";

type QueuedImport = {
  id: string;
  file: File;
  status: QueueStatus;
  message: string;
};

const emptyPrompt: PromptResponse = { indexPath: "", promptPath: "", index: "", prompt: "" };
const importProgressMessages = [
  { min: 0, message: "Waiting for import." },
  { min: 4, message: "Uploading the Markdown file and starting the import." },
  { min: 18, message: "Codex is reading the source and removing low-value noise." },
  { min: 38, message: "Codex is splitting useful research into standalone knowledge units." },
  { min: 60, message: "Codex is writing cleaned Markdown files into the vault." },
  { min: 78, message: "The vault is being indexed and metadata is being refreshed." },
  { min: 90, message: "Folder indexes and the global brain prompt are being rebuilt." },
  { min: 98, message: "Almost finished; waiting for the final import report." },
  { min: 100, message: "Ready. Import completed and the global prompt is updated." }
];

function importMessageForProgress(progress: number) {
  return [...importProgressMessages].reverse().find((step) => progress >= step.min)?.message ?? importProgressMessages[0].message;
}

function queueProgressMessage(baseMessage: string, fileName: string, position: number, total: number) {
  return total > 1 ? `File ${position} of ${total}: ${baseMessage} (${fileName})` : baseMessage;
}

function makeQueueId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function parseMetadataList(raw: string) {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

async function writeClipboardText(text: string) {
  if (!text) throw new Error("There is no prompt content to copy yet.");

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some desktop webviews expose the Clipboard API but still reject writes.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "-9999px";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);
  if (!copied) throw new Error("Copy failed. Please try again.");
}

async function createCompletionSound() {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  await context.resume();

  return () => {
    const masterGain = context.createGain();
    masterGain.gain.setValueAtTime(0.0001, context.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.08);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 10);
    masterGain.connect(context.destination);

    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];
    for (let beat = 0; beat < 20; beat += 1) {
      const start = context.currentTime + beat * 0.5;
      const frequency = notes[beat % notes.length];
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.01, start + 0.18);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.34);
      oscillator.connect(gain);
      gain.connect(masterGain);
      oscillator.start(start);
      oscillator.stop(start + 0.38);
    }

    window.setTimeout(() => context.close().catch(() => undefined), 10_500);
  };
}

function App() {
  const [activeModule, setActiveModule] = useState<ModuleName>("import");
  const [structure, setStructure] = useState<StructureResponse | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);
  const [folderPrompt, setFolderPrompt] = useState<PromptResponse>(emptyPrompt);
  const [brainPrompt, setBrainPrompt] = useState<PromptResponse>(emptyPrompt);
  const [activePromptTab, setActivePromptTab] = useState<PromptTab>("folderPrompt");
  const [importQueue, setImportQueue] = useState<QueuedImport[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState(importMessageForProgress(0));
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [brainCopyState, setBrainCopyState] = useState<CopyState>("idle");
  const progressTimer = useRef<number | null>(null);
  const brainCopyTimer = useRef<number | null>(null);
  const progressStartedAt = useRef(0);

  const selectedFolder = useMemo(
    () => structure?.folders.find((folder) => folder.id === selectedFolderId) ?? structure?.folders[0],
    [structure, selectedFolderId]
  );

  const activePrompt = useMemo(() => {
    if (activePromptTab === "brainPrompt") {
      return {
        title: "Global Brain Prompt",
        path: brainPrompt.promptPath,
        value: brainPrompt.prompt,
        copyLabel: "Global brain prompt"
      };
    }

    if (activePromptTab === "folderIndex") {
      return {
        title: "Folder Index",
        path: folderPrompt.indexPath,
        value: folderPrompt.index,
        copyLabel: "Folder index"
      };
    }

    return {
      title: "Folder Prompt",
      path: folderPrompt.promptPath,
      value: folderPrompt.prompt,
      copyLabel: "Folder prompt"
    };
  }, [activePromptTab, brainPrompt, folderPrompt]);

  async function refreshStructure(nextFolderId = selectedFolderId) {
    const nextStructure = await api<StructureResponse>("/api/structure");
    setStructure(nextStructure);
    const activeFolderId =
      nextStructure.folders.find((folder) => folder.id === nextFolderId)?.id || nextStructure.folders[0]?.id || "";
    setSelectedFolderId(activeFolderId);

    const [folderPromptResponse, brainPromptResponse] = await Promise.all([
      activeFolderId ? api<PromptResponse>(`/api/folders/${activeFolderId}/prompts`) : Promise.resolve(emptyPrompt),
      api<PromptResponse>("/api/prompts/brain")
    ]);
    setFolderPrompt(folderPromptResponse);
    setBrainPrompt(brainPromptResponse);
  }

  useEffect(() => {
    refreshStructure().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    return () => {
      if (brainCopyTimer.current) window.clearTimeout(brainCopyTimer.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedFolderId) return;
    Promise.all([
      api<PromptResponse>(`/api/folders/${selectedFolderId}/prompts`),
      api<PromptResponse>("/api/prompts/brain")
    ])
      .then(([folderPromptResponse, brainPromptResponse]) => {
        setFolderPrompt(folderPromptResponse);
        setBrainPrompt(brainPromptResponse);
        if (selectedFile && !selectedFolder?.files.some((file) => file.id === selectedFile.id)) {
          setSelectedFile(null);
        }
      })
      .catch((err) => setError(err.message));
  }, [selectedFolderId]);

  function startProgress(fileName = "", position = 1, total = 1) {
    progressStartedAt.current = Date.now();
    setProgress(4);
    setProgressMessage(queueProgressMessage(importMessageForProgress(4), fileName, position, total));
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = window.setInterval(() => {
      setProgress((current) => {
        const elapsed = Date.now() - progressStartedAt.current;
        const target =
          elapsed < 3_000
            ? 18
            : elapsed < 9_000
              ? 38
              : elapsed < 18_000
                ? 60
                : elapsed < 32_000
                  ? 78
                  : elapsed < 55_000
                    ? 90
                    : elapsed < 90_000
                      ? 98
                      : 99;
        if (current >= target) return current;
        const next = Math.min(99, current + Math.max(1, Math.ceil((target - current) / 4)));
        setProgressMessage(queueProgressMessage(importMessageForProgress(next), fileName, position, total));
        return next;
      });
    }, 850);
  }

  function stopProgress(finalValue: number, message = importMessageForProgress(finalValue)) {
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = null;
    setProgress(finalValue);
    setProgressMessage(message);
  }

  async function autoImport(event: React.FormEvent) {
    event.preventDefault();
    if (!importQueue.some((item) => item.status === "pending") || importing) return;

    setError("");
    setNotice("");
    setImportResult(null);
    setImporting(true);
    const queuedItems = importQueue.filter((item) => item.status === "pending");
    const playCompletionSound = await createCompletionSound().catch(() => null);
    let completedCount = 0;
    let failedCount = 0;
    let lastFolderId = "";

    try {
      for (const [index, item] of queuedItems.entries()) {
        const position = index + 1;
        setImportQueue((current) =>
          current.map((queueItem) =>
            queueItem.id === item.id ? { ...queueItem, status: "importing", message: "Importing now." } : queueItem
          )
        );
        startProgress(item.file.name, position, queuedItems.length);

        try {
          const form = new FormData();
          form.append("file", item.file);
          const result = await api<ImportResult>("/api/import/auto", { method: "POST", body: form });
          completedCount += 1;
          lastFolderId = result.folders[0]?.id ?? lastFolderId;
          setImportResult(result);
          const doneMessage =
            result.gitSync?.action === "committed-and-pushed"
              ? "Imported successfully and pushed to GitHub."
              : result.gitSync?.action === "no-changes"
                ? "Imported successfully. No Git changes needed."
                : result.gitSync?.ok === false
                  ? `Imported successfully. Git sync needs attention: ${result.gitSync.message}`
                  : "Imported successfully.";
          setImportQueue((current) =>
            current.map((queueItem) =>
              queueItem.id === item.id ? { ...queueItem, status: "done", message: doneMessage } : queueItem
            )
          );
          setProgress(99);
          setProgressMessage(
            queueProgressMessage("Finalizing this file and moving to the next item.", item.file.name, position, queuedItems.length)
          );
        } catch (err) {
          failedCount += 1;
          const message = err instanceof Error ? err.message : "Automatic import failed.";
          setImportQueue((current) =>
            current.map((queueItem) =>
              queueItem.id === item.id ? { ...queueItem, status: "failed", message } : queueItem
            )
          );
        }
      }

      setProgressMessage("Refreshing the vault structure after the queue finished.");
      await refreshStructure(lastFolderId);

      if (failedCount > 0) {
        stopProgress(0, "Queue finished with failed files. Check the list above.");
        setError(
          `${completedCount} file${completedCount === 1 ? "" : "s"} imported, ${failedCount} failed. Failed files stayed in the queue.`
        );
        return;
      }

      stopProgress(100, "Ready. All queued files were imported.");
      setNotice(`Ready. ${completedCount} file${completedCount === 1 ? "" : "s"} imported. Completion sound is playing.`);
      playCompletionSound?.();
    } catch (err) {
      stopProgress(0, "Import failed. Check the error message above.");
      setError(err instanceof Error ? err.message : "Automatic import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function loadFile(fileId: string) {
    try {
      setError("");
      const detail = await api<FileDetail>(`/api/files/${fileId}`);
      setSelectedFile(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "File preview failed.");
    }
  }

  function addImportFiles(files: File[]) {
    if (importing) return;
    const markdownFiles = files.filter((file) => file.name.toLowerCase().endsWith(".md") || file.type === "text/markdown");
    if (markdownFiles.length !== files.length) {
      setError("Only .md files are supported. Non-Markdown files were skipped.");
    } else {
      setError("");
    }
    if (!markdownFiles.length) return;

    const nextItems = markdownFiles.map((file) => ({
      id: makeQueueId(),
      file,
      status: "pending" as QueueStatus,
      message: "Waiting in queue."
    }));
    setImportQueue((current) => [...current, ...nextItems]);
    setProgress(0);
    setProgressMessage(
      `${markdownFiles.length} file${markdownFiles.length === 1 ? "" : "s"} added to the queue. Click Import Queue to start.`
    );
  }

  function clearImportQueue() {
    if (importing) return;
    setImportQueue([]);
    setImportResult(null);
    setProgress(0);
    setProgressMessage(importMessageForProgress(0));
  }

  async function copyText(text: string, label: string) {
    await writeClipboardText(text);
    setNotice(`${label} copied.`);
  }

  async function copyBrainPrompt() {
    if (brainCopyTimer.current) window.clearTimeout(brainCopyTimer.current);
    setBrainCopyState("copying");
    setError("");

    try {
      await copyText(brainPrompt.prompt, "Global brain prompt");
      setBrainCopyState("copied");
      brainCopyTimer.current = window.setTimeout(() => setBrainCopyState("idle"), 1600);
      api<PromptResponse>("/api/prompts/brain")
        .then(setBrainPrompt)
        .catch((err) => setError(err.message));
    } catch (err) {
      setBrainCopyState("idle");
      setError(err instanceof Error ? err.message : "Copy failed. Please try again.");
    }
  }

  function changePromptTab(tab: PromptTab) {
    setActivePromptTab(tab);
    if (tab === "brainPrompt") {
      api<PromptResponse>("/api/prompts/brain")
        .then(setBrainPrompt)
        .catch((err) => setError(err.message));
    }
  }

  return (
    <main className="app-shell automatic-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brain-mark" aria-hidden="true">
            <span className="folder-icon large-folder" />
          </div>
          <div>
            <p className="eyebrow">Automatic Research Vault</p>
            <h1>Codex Research Brain</h1>
          </div>
        </div>

        <nav className="module-nav" aria-label="Main modules">
          <button
            className={activeModule === "import" ? "module-button active-module" : "module-button"}
            onClick={() => setActiveModule("import")}
          >
            <span className="module-dot import-dot" />
            Import
          </button>
          <button
            className={activeModule === "structure" ? "module-button active-module" : "module-button"}
            onClick={() => setActiveModule("structure")}
          >
            <span className="module-dot structure-dot" />
            Structure
          </button>
        </nav>

        <section className="vault-summary">
          <p className="eyebrow">Vault</p>
          <strong>{structure?.folders.length ?? 0} folders</strong>
          <span>{structure?.folders.reduce((count, folder) => count + folder.files.length, 0) ?? 0} files indexed</span>
        </section>
      </aside>

      <section className="content">
        {(notice || error) && (
          <div className={error ? "banner error" : "banner"}>
            {error || notice}
            <button
              onClick={() => {
                setNotice("");
                setError("");
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {activeModule === "import" ? (
          <ImportModule
            queue={importQueue}
            brainPrompt={brainPrompt}
            importing={importing}
            progress={progress}
            progressMessage={progressMessage}
            result={importResult}
            onFilesAdd={addImportFiles}
            onClearQueue={clearImportQueue}
            onSubmit={autoImport}
            onCopyBrainPrompt={copyBrainPrompt}
            brainCopyState={brainCopyState}
          />
        ) : (
          <StructureModule
            structure={structure}
            selectedFolderId={selectedFolderId}
            selectedFolder={selectedFolder}
            selectedFile={selectedFile}
            activePrompt={activePrompt}
            activePromptTab={activePromptTab}
            onSelectFolder={(folderId) => {
              setSelectedFolderId(folderId);
              setSelectedFile(null);
            }}
            onPreviewFile={loadFile}
            onPromptTabChange={changePromptTab}
            onCopy={copyText}
          />
        )}
      </section>
    </main>
  );
}

function ImportModule(props: {
  queue: QueuedImport[];
  brainPrompt: PromptResponse;
  importing: boolean;
  progress: number;
  progressMessage: string;
  result: ImportResult | null;
  onFilesAdd: (files: File[]) => void;
  onClearQueue: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onCopyBrainPrompt: () => void;
  brainCopyState: CopyState;
}) {
  const pendingCount = props.queue.filter((item) => item.status === "pending").length;
  const doneCount = props.queue.filter((item) => item.status === "done").length;
  const failedCount = props.queue.filter((item) => item.status === "failed").length;
  const totalSize = props.queue.reduce((sum, item) => sum + item.file.size, 0);

  return (
    <section className="import-module">
      <div className="hero-panel">
        <span className="folder-icon header-folder inbox-folder" aria-hidden="true" />
        <div>
          <p className="eyebrow">One-Step Import</p>
          <h2>Import one document. Build a structured knowledge system.</h2>
          <p>
            Codex CLI deeply analyzes the source, removes low-value noise, splits mixed topics into standalone knowledge
            units, distributes them across the right folders, and rebuilds indexes and prompts automatically.
          </p>
        </div>
      </div>

      <section className="panel prompt-shortcut">
        <div>
          <p className="eyebrow">Codex Prompt</p>
          <h3>Global Brain Prompt</h3>
          <code>{props.brainPrompt.promptPath || "Prompt will be available after the vault starts."}</code>
        </div>
        <button
          className={`primary copy-prompt-button ${props.brainCopyState === "copied" ? "copied" : ""}`}
          type="button"
          onClick={props.onCopyBrainPrompt}
          disabled={!props.brainPrompt.prompt || props.brainCopyState === "copying"}
        >
          <span className="copy-prompt-text">
            {props.brainCopyState === "copying"
              ? "Copying..."
              : props.brainCopyState === "copied"
                ? "Copied"
                : "Copy Main Prompt"}
          </span>
          <span className="copy-prompt-glow" aria-hidden="true" />
        </button>
      </section>

      <form className="panel import-card" onSubmit={props.onSubmit}>
        <label className={props.queue.length ? "drop-zone has-file" : "drop-zone"}>
          <input
            type="file"
            accept=".md,text/markdown"
            multiple
            onChange={(event) => {
              props.onFilesAdd(Array.from(event.target.files ?? []));
              event.currentTarget.value = "";
            }}
            disabled={props.importing}
          />
          <span className="doc-icon large-doc" aria-hidden="true" />
          <strong>{props.queue.length ? `${props.queue.length} files in queue` : "Choose Markdown Files"}</strong>
          <small>
            {props.queue.length
              ? `${formatBytes(totalSize)} selected. Files will import one by one.`
              : "Select one or more .md files"}
          </small>
        </label>

        {props.queue.length ? (
          <div className="queue-summary">
            <InfoBlock label="Pending" value={String(pendingCount)} />
            <InfoBlock label="Done" value={String(doneCount)} />
            <InfoBlock label="Failed" value={String(failedCount)} />
          </div>
        ) : null}

        {props.queue.length ? (
          <div className="queue-list" aria-label="Import queue">
            {props.queue.map((item, index) => (
              <article key={item.id} className={`queue-item ${item.status}`}>
                <span className="queue-position">{index + 1}</span>
                <div>
                  <strong>{item.file.name}</strong>
                  <small>
                    {formatBytes(item.file.size)} · {item.message}
                  </small>
                </div>
                <span className="queue-status">{item.status}</span>
              </article>
            ))}
          </div>
        ) : null}

        <div className="button-row">
          <button className="primary import-button" type="submit" disabled={!pendingCount || props.importing}>
            {props.importing ? "Importing Queue..." : "Import Queue"}
          </button>
          <button type="button" onClick={props.onClearQueue} disabled={!props.queue.length || props.importing}>
            Clear Queue
          </button>
        </div>

        <div className="progress-wrap" aria-label="Import progress">
          <div className="progress-track">
            <span style={{ width: `${props.progress}%` }} />
          </div>
          <strong>{props.progress}%</strong>
        </div>

        <div className={props.progress === 100 ? "ready-state ready" : "ready-state"} role="status" aria-live="polite">
          <span>{props.progressMessage}</span>
        </div>
      </form>

      {props.result ? (
        <section className="panel result-card">
          <div className="panel-title">
            <div>
              <h3>Last Import</h3>
              <p>{props.result.plan.documentSummary}</p>
            </div>
            <span className="pill">{Math.round(props.result.plan.confidence * 100)}% confidence</span>
          </div>
          <div className="result-grid">
            <InfoBlock label="Source" value={props.result.plan.documentTitle} />
            <InfoBlock label="Knowledge Units" value={String(props.result.files.length)} />
            <InfoBlock label="Folders Used" value={String(props.result.folders.length)} />
          </div>
          <div className="segment-list">
            {props.result.segments.map((segment) => (
              <article key={segment.fileId} className="segment-result">
                <div>
                  <strong>{segment.title}</strong>
                  <p>{segment.summary}</p>
                </div>
                <span className="pill">{segment.folderName}</span>
              </article>
            ))}
          </div>
          {props.result.plan.discardedSummary ? (
            <p className="discarded-note">
              <strong>Excluded noise:</strong> {props.result.plan.discardedSummary}
            </p>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

function StructureModule(props: {
  structure: StructureResponse | null;
  selectedFolderId: string;
  selectedFolder?: Folder;
  selectedFile: FileDetail | null;
  activePrompt: { title: string; path: string; value: string; copyLabel: string };
  activePromptTab: PromptTab;
  onSelectFolder: (folderId: string) => void;
  onPreviewFile: (fileId: string) => void;
  onPromptTabChange: (tab: PromptTab) => void;
  onCopy: (text: string, label: string) => void;
}) {
  const folders = props.structure?.folders ?? [];
  const totalFiles = folders.reduce((count, folder) => count + folder.files.length, 0);
  const selectedFiles = props.selectedFolder?.files ?? [];
  const selectedBytes = selectedFiles.reduce((sum, file) => sum + file.size_bytes, 0);

  return (
    <section className="structure-module">
      <section className="panel brain-map-panel">
        <div className="brain-panel-heading">
          <div className="panel-title compact">
            <div>
              <p className="eyebrow">Folder Map</p>
              <h3>2D Knowledge Brain</h3>
            </div>
            <span className="pill">{folders.length} folders</span>
          </div>
          <div className="brain-mini-stats">
            <span>{totalFiles} knowledge files</span>
            <span>{props.selectedFolder?.name ?? "No cluster selected"}</span>
            <span>{formatBytes(selectedBytes)} selected</span>
          </div>
        </div>

        <div className="brain-map" aria-label="Folder brain map">
          <BrainMap2D folders={folders} selectedFolderId={props.selectedFolderId} onSelectFolder={props.onSelectFolder} />
        </div>
      </section>

      <section className="file-workspace">
        <section className="panel preview-panel">
          <div className="panel-title">
            <div>
              <h3>File Preview</h3>
              <code>{props.selectedFile?.path || "Select a Markdown file to preview it."}</code>
            </div>
            <button
              onClick={() => props.selectedFile && props.onCopy(props.selectedFile.path, "File path")}
              disabled={!props.selectedFile}
            >
              Copy Path
            </button>
          </div>
          {props.selectedFile ? (
            <textarea readOnly value={props.selectedFile.content} rows={18} />
          ) : (
            <p className="muted">Preview shows the real Markdown file stored on disk.</p>
          )}
        </section>

        <section className="panel prompt-panel">
          <div className="tabs">
            <button
              className={props.activePromptTab === "folderPrompt" ? "tab active-tab" : "tab"}
              onClick={() => props.onPromptTabChange("folderPrompt")}
            >
              Folder Prompt
            </button>
            <button
              className={props.activePromptTab === "brainPrompt" ? "tab active-tab" : "tab"}
              onClick={() => props.onPromptTabChange("brainPrompt")}
            >
              Global Brain Prompt
            </button>
            <button
              className={props.activePromptTab === "folderIndex" ? "tab active-tab" : "tab"}
              onClick={() => props.onPromptTabChange("folderIndex")}
            >
              Folder Index
            </button>
          </div>
          <div className="panel-title">
            <div>
              <h3>{props.activePrompt.title}</h3>
              <code>{props.activePrompt.path}</code>
            </div>
            <button onClick={() => props.onCopy(props.activePrompt.value, props.activePrompt.copyLabel)}>
              Copy
            </button>
          </div>
          <textarea readOnly value={props.activePrompt.value} rows={18} />
        </section>
      </section>
    </section>
  );
}

function BrainMap2D(props: { folders: Folder[]; selectedFolderId: string; onSelectFolder: (folderId: string) => void }) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    files: number;
    size: string;
    coverage: number;
    color: string;
  } | null>(null);
  const brainGreen = "#0f766e";
  const positions = [
    [24, 29],
    [38, 20],
    [57, 21],
    [75, 31],
    [20, 45],
    [36, 40],
    [37, 52],
    [80, 46],
    [25, 65],
    [43, 61],
    [62, 62],
    [76, 67],
    [56, 79]
  ] as const;
  const brainFolds = [
    "M17 33 C22 27 31 25 39 29 C43 22 53 20 58 26",
    "M12 44 C20 40 28 40 36 44 C43 38 51 39 56 45",
    "M16 57 C26 52 35 55 43 61 C49 55 58 55 66 61",
    "M24 72 C32 67 41 68 49 74",
    "M83 34 C78 28 69 26 61 30 C57 24 48 22 42 28",
    "M88 47 C80 42 72 42 64 46 C58 40 51 41 45 47",
    "M84 59 C75 54 67 56 59 62 C53 56 45 56 36 62",
    "M75 73 C67 67 58 69 50 75",
    "M28 18 C35 12 44 13 49 20",
    "M52 19 C58 13 69 14 75 22"
  ];
  const totalBytes = props.folders.reduce(
    (sum, folder) => sum + folder.files.reduce((fileSum, file) => fileSum + file.size_bytes, 0),
    0
  );
  const nodes = props.folders.map((folder, index) => {
    const bytes = folder.files.reduce((sum, file) => sum + file.size_bytes, 0);
    const coverage = totalBytes ? bytes / totalBytes : 0;
    const fallbackAngle = (index / Math.max(props.folders.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const fallbackRadiusX = index % 2 ? 34 : 28;
    const fallbackRadiusY = index % 2 ? 28 : 34;
    const [x, y] =
      positions[index] ??
      ([50 + Math.cos(fallbackAngle) * fallbackRadiusX, 50 + Math.sin(fallbackAngle) * fallbackRadiusY] as const);
    const areaRadius = 6.6 + Math.min(7, folder.files.length * 0.45 + coverage * 18);
    const dotRadius = 1.25 + Math.min(0.82, folder.files.length * 0.055 + coverage * 2.2);
    return {
      folder,
      x,
      y,
      bytes,
      coverage,
      color: brainGreen,
      areaRadius,
      dotRadius
    };
  });

  return (
    <div className="brain-2d-stage">
      <svg className="brain-2d-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="2D knowledge brain">
        <defs>
          <radialGradient id="brainLobeFill" cx="50%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.82" />
            <stop offset="54%" stopColor="#dff5f2" stopOpacity="0.56" />
            <stop offset="100%" stopColor="#c8e7e4" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id="brainCoreFill" cx="38%" cy="28%" r="76%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="48%" stopColor="#ecfbf9" />
            <stop offset="100%" stopColor="#c8ebe7" />
          </radialGradient>
          <radialGradient id="dotFill" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#7dd6cb" />
            <stop offset="48%" stopColor="#17877d" />
            <stop offset="100%" stopColor="#07534e" />
          </radialGradient>
          <filter id="brainSoftBlur">
            <feGaussianBlur stdDeviation="2.9" />
          </filter>
          <filter id="dotGlow">
            <feDropShadow dx="0" dy="0.55" stdDeviation="0.46" floodColor="#063f3b" floodOpacity="0.24" />
          </filter>
          <filter id="coreLift">
            <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#0f766e" floodOpacity="0.2" />
          </filter>
        </defs>
        <g className="brain-2d-shell">
          <path
            className="brain-2d-lobe brain-2d-lobe-left"
            d="M49 10 C40 6 31 9 27 17 C18 17 11 24 10 35 C4 40 4 51 9 58 C7 69 14 82 28 84 C34 91 45 88 49 82 C47 72 51 63 49 53 C47 43 52 33 48 25 C46 19 45 14 49 10Z"
          />
          <path
            className="brain-2d-lobe brain-2d-lobe-right"
            d="M51 10 C60 6 69 9 73 17 C82 17 89 24 90 35 C96 40 96 51 91 58 C93 69 86 82 72 84 C66 91 55 88 51 82 C53 72 49 63 51 53 C53 43 48 33 52 25 C54 19 55 14 51 10Z"
          />
          <path className="brain-2d-stem" d="M47 84 C45 91 47 97 50 96 C53 97 55 91 53 84 C51 87 49 87 47 84Z" />
          <path className="brain-2d-outline" d="M49 10 C40 6 31 9 27 17 C18 17 11 24 10 35 C4 40 4 51 9 58 C7 69 14 82 28 84 C34 91 45 88 49 82" />
          <path className="brain-2d-outline" d="M51 10 C60 6 69 9 73 17 C82 17 89 24 90 35 C96 40 96 51 91 58 C93 69 86 82 72 84 C66 91 55 88 51 82" />
          <path className="brain-2d-groove" d="M50 12 C48 23 53 33 50 44 C47 56 53 67 50 82" />
          {brainFolds.map((fold) => (
            <path key={fold} className="brain-2d-fold" d={fold} />
          ))}
        </g>

        {nodes.map((node) => (
          <g
            key={`${node.folder.id}-area`}
            className={node.folder.id === props.selectedFolderId ? "active-brain-area" : "brain-area"}
          >
            <circle cx={node.x} cy={node.y} r={node.areaRadius * 1.5} fill={node.color} filter="url(#brainSoftBlur)" />
            <circle cx={node.x} cy={node.y} r={node.areaRadius} fill={node.color} />
            <circle cx={node.x} cy={node.y} r={node.areaRadius * 0.58} fill={node.color} />
          </g>
        ))}

        {nodes.map((node, index) => (
          <path
            key={`${node.folder.id}-line`}
            className={node.folder.id === props.selectedFolderId ? "active-brain-link" : "brain-link"}
            d={`M${node.x} ${node.y} Q${50 + (node.x - 50) * 0.34} ${50 + (node.y - 50) * 0.28 + (index % 2 === 0 ? -3.2 : 3.2)} 50 50`}
            stroke={node.color}
          />
        ))}
        {nodes.map((node, index) => (
          index % 3 === 0 ? (
            <circle
              key={`${node.folder.id}-spark`}
              className="brain-link-spark"
              cx={node.x + (50 - node.x) * 0.42}
              cy={node.y + (50 - node.y) * 0.42}
              r="0.38"
            />
          ) : null
        ))}

        <g className="brain-2d-core" filter="url(#coreLift)">
          <circle cx="50" cy="50" r="7.5" />
          <circle className="brain-2d-core-ring" cx="50" cy="50" r="9.8" />
          <text x="50" y="49.5">
            {props.folders.length}
          </text>
          <text x="50" y="55.2" className="brain-core-label">
            clusters
          </text>
        </g>

        {nodes.map((node) => (
          <g
            key={node.folder.id}
            className={node.folder.id === props.selectedFolderId ? "brain-dot-group active-brain-dot-group" : "brain-dot-group"}
            tabIndex={0}
            role="button"
            aria-label={`${node.folder.name}, ${node.folder.files.length} files, ${formatBytes(node.bytes)}`}
            onClick={() => props.onSelectFolder(node.folder.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") props.onSelectFolder(node.folder.id);
            }}
            onPointerEnter={(event) => {
              const bounds = event.currentTarget.closest(".brain-2d-stage")?.getBoundingClientRect();
              setTooltip({
                x: bounds ? event.clientX - bounds.left : 0,
                y: bounds ? event.clientY - bounds.top : 0,
                name: node.folder.name,
                files: node.folder.files.length,
                size: formatBytes(node.bytes),
                coverage: node.coverage,
                color: node.color
              });
            }}
            onPointerMove={(event) => {
              const bounds = event.currentTarget.closest(".brain-2d-stage")?.getBoundingClientRect();
              setTooltip((current) =>
                current && bounds ? { ...current, x: event.clientX - bounds.left, y: event.clientY - bounds.top } : current
              );
            }}
            onPointerLeave={() => setTooltip(null)}
          >
            <title>
              {node.folder.name} · {node.folder.files.length} files · {formatBytes(node.bytes)} ·{" "}
              {Math.max(1, Math.round(node.coverage * 100))}% coverage
            </title>
            <circle className="brain-dot-halo" cx={node.x} cy={node.y} r={node.dotRadius * 3} fill={node.color} />
            <circle className="brain-dot" cx={node.x} cy={node.y} r={node.dotRadius} fill="url(#dotFill)" filter="url(#dotGlow)" />
            <circle className="brain-dot-shine" cx={node.x - node.dotRadius * 0.35} cy={node.y - node.dotRadius * 0.42} r={node.dotRadius * 0.34} />
          </g>
        ))}
      </svg>
      <div className="brain-2d-legend">
        <span className="legend-info">i</span>
        Hover a dot to see the cluster name, size, and brain coverage.
      </div>
      <div className="brain-map-controls" aria-hidden="true">
        <span>+</span>
        <span>-</span>
        <span>⌗</span>
      </div>
      {tooltip ? (
        <div
          className="brain-tooltip"
          style={{
            left: Math.min(tooltip.x + 16, 620),
            top: Math.max(14, tooltip.y - 18),
            borderColor: tooltip.color
          }}
        >
          <strong>{tooltip.name}</strong>
          <span>
            {tooltip.files} files · {tooltip.size} · {Math.max(1, Math.round(tooltip.coverage * 100))}% coverage
          </span>
        </div>
      ) : null}
    </div>
  );
}

function InfoBlock(props: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
