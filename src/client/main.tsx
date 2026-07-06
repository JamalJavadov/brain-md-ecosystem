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

type ImportResult = {
  ok: boolean;
  importId: string;
  plan: {
    documentTitle: string;
    documentSummary: string;
    discardedSummary: string;
    confidence: number;
  };
  folders: Folder[];
  files: ResearchFile[];
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

function App() {
  const [activeModule, setActiveModule] = useState<ModuleName>("import");
  const [structure, setStructure] = useState<StructureResponse | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileDetail | null>(null);
  const [folderPrompt, setFolderPrompt] = useState<PromptResponse>(emptyPrompt);
  const [brainPrompt, setBrainPrompt] = useState<PromptResponse>(emptyPrompt);
  const [activePromptTab, setActivePromptTab] = useState<PromptTab>("folderPrompt");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState(importMessageForProgress(0));
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const progressTimer = useRef<number | null>(null);
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

  function startProgress() {
    progressStartedAt.current = Date.now();
    setProgress(4);
    setProgressMessage(importMessageForProgress(4));
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
        setProgressMessage(importMessageForProgress(next));
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
    if (!importFile || importing) return;

    setError("");
    setNotice("");
    setImportResult(null);
    setImporting(true);
    startProgress();

    try {
      const form = new FormData();
      form.append("file", importFile);
      const result = await api<ImportResult>("/api/import/auto", { method: "POST", body: form });
      setProgress(99);
      setProgressMessage("Finalizing the vault structure and refreshing prompt data.");
      setImportResult(result);
      setNotice(
        `Ready. Codex created ${result.files.length} knowledge unit${result.files.length === 1 ? "" : "s"} across ${result.folders.length} folder${result.folders.length === 1 ? "" : "s"}.`
      );
      setImportFile(null);
      await refreshStructure(result.folders[0]?.id ?? "");
      stopProgress(100);
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

  function updateImportFile(file: File | null) {
    setImportFile(file);
    if (importing) return;
    setProgress(0);
    setProgressMessage(file ? `${file.name} is ready. Click Import Automatically to start.` : importMessageForProgress(0));
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setNotice(`${label} copied.`);
  }

  async function copyBrainPrompt() {
    const freshPrompt = await api<PromptResponse>("/api/prompts/brain");
    setBrainPrompt(freshPrompt);
    await copyText(freshPrompt.prompt, "Global brain prompt");
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
            file={importFile}
            brainPrompt={brainPrompt}
            importing={importing}
            progress={progress}
            progressMessage={progressMessage}
            result={importResult}
            onFileChange={updateImportFile}
            onSubmit={autoImport}
            onCopyBrainPrompt={copyBrainPrompt}
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
  file: File | null;
  brainPrompt: PromptResponse;
  importing: boolean;
  progress: number;
  progressMessage: string;
  result: ImportResult | null;
  onFileChange: (file: File | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCopyBrainPrompt: () => void;
}) {
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
          className="primary"
          type="button"
          onClick={props.onCopyBrainPrompt}
          disabled={!props.brainPrompt.prompt}
        >
          Copy Main Prompt
        </button>
      </section>

      <form className="panel import-card" onSubmit={props.onSubmit}>
        <label className={props.file ? "drop-zone has-file" : "drop-zone"}>
          <input
            type="file"
            accept=".md,text/markdown"
            onChange={(event) => props.onFileChange(event.target.files?.[0] ?? null)}
            disabled={props.importing}
          />
          <span className="doc-icon large-doc" aria-hidden="true" />
          <strong>{props.file ? props.file.name : "Choose Markdown File"}</strong>
          <small>{props.file ? `${formatBytes(props.file.size)} ready to import` : "Only .md files are supported"}</small>
        </label>

        <button className="primary import-button" type="submit" disabled={!props.file || props.importing}>
          {props.importing ? "Importing..." : "Import Automatically"}
        </button>

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
  return (
    <section className="structure-module">
      <header className="topbar structure-topbar">
        <div className="folder-heading">
          <span
            className={props.selectedFolder?.is_inbox ? "folder-icon header-folder inbox-folder" : "folder-icon header-folder"}
            aria-hidden="true"
          />
          <div>
            <p className="eyebrow">File Structure</p>
            <h2>{props.selectedFolder?.name ?? "No folder selected"}</h2>
            <p>{props.selectedFolder?.description || "Automatic import will create folders here."}</p>
          </div>
        </div>
        <div className="structure-path">
          <span>Brain root</span>
          <code>{props.structure?.brainDir ?? ""}</code>
        </div>
      </header>

      <section className="structure-grid">
        <aside className="panel folder-tree-panel">
          <h3>Folders</h3>
          <div className="folder-list">
            {props.structure?.folders.map((folder) => (
              <button
                key={folder.id}
                className={folder.id === props.selectedFolderId ? "folder active" : "folder"}
                onClick={() => props.onSelectFolder(folder.id)}
              >
                <span className={folder.is_inbox ? "folder-icon inbox-folder" : "folder-icon"} aria-hidden="true" />
                <span className="folder-text">
                  <span>{folder.name}</span>
                  <small>
                    {folder.files.length} file{folder.files.length === 1 ? "" : "s"}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel file-browser-panel">
          <h3>Files</h3>
          <div className="file-list">
            {props.selectedFolder?.files.length ? (
              props.selectedFolder.files.map((file) => (
                <article
                  key={file.id}
                  className={props.selectedFile?.id === file.id ? "file-row active-file" : "file-row"}
                >
                  <div className="file-meta">
                    <strong>
                      <span className="doc-icon" aria-hidden="true" />
                      {file.display_name}
                    </strong>
                    {file.summary ? <p className="file-summary">{file.summary}</p> : null}
                    <p>
                      Importance {file.importance}/5 · {formatBytes(file.size_bytes)} ·{" "}
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                    {parseMetadataList(file.tags_json).length ? (
                      <div className="tag-list">
                        {parseMetadataList(file.tags_json).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                    <code>{file.path}</code>
                  </div>
                  <button onClick={() => props.onPreviewFile(file.id)}>Preview</button>
                </article>
              ))
            ) : (
              <p className="muted">No files in this folder yet.</p>
            )}
          </div>
        </section>
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

function InfoBlock(props: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
