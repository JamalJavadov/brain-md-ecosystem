import AppKit
import UniformTypeIdentifiers
import WebKit

private let projectPath = "__PROJECT_PATH__"
private let nodePath = "__NODE_PATH__"
private let appURL = URL(string: "http://127.0.0.1:4000/")!
private let healthURL = URL(string: "http://127.0.0.1:4000/api/health")!

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate, WKUIDelegate {
    private var window: NSWindow!
    private var webView: WKWebView!
    private var backendProcess: Process?
    private var logHandle: FileHandle?
    private var ownsBackend = false
    private var launchAttempts = 0

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        configureMenu()
        configureWindow()
        showLoading()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        ensureBackend()
    }

    func applicationWillTerminate(_ notification: Notification) {
        if ownsBackend, let process = backendProcess, process.isRunning {
            process.terminate()
        }
        try? logHandle?.close()
    }

    func windowWillClose(_ notification: Notification) {
        NSApp.terminate(nil)
    }

    private func configureMenu() {
        let mainMenu = NSMenu()
        let appItem = NSMenuItem()
        mainMenu.addItem(appItem)

        let appMenu = NSMenu()
        appMenu.addItem(
            withTitle: "Quit Codex Research Brain",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        )
        appItem.submenu = appMenu

        let viewItem = NSMenuItem()
        mainMenu.addItem(viewItem)
        let viewMenu = NSMenu(title: "View")
        let reloadItem = NSMenuItem(
            title: "Reload",
            action: #selector(reloadPage),
            keyEquivalent: "r"
        )
        reloadItem.target = self
        viewMenu.addItem(reloadItem)
        viewItem.submenu = viewMenu
        NSApp.mainMenu = mainMenu
    }

    private func configureWindow() {
        let configuration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Codex Research Brain"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.minSize = NSSize(width: 900, height: 620)
        window.center()
        window.contentView = webView
        window.delegate = self
    }

    private func showLoading() {
        let html = """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              color: #17212b;
              background: #f3fbfa;
            }
            main { text-align: center; }
            .folder {
              position: relative;
              width: 94px;
              height: 66px;
              margin: 0 auto 24px;
              border: 3px solid #9b6b08;
              border-radius: 9px;
              background: #f8c847;
            }
            .folder::before {
              content: "";
              position: absolute;
              top: -18px;
              left: 7px;
              width: 45px;
              height: 18px;
              border: 3px solid #9b6b08;
              border-bottom: 0;
              border-radius: 8px 8px 0 0;
              background: #ffd86f;
            }
            .spinner {
              width: 26px;
              height: 26px;
              margin: 16px auto 0;
              border: 3px solid #cce9e6;
              border-top-color: #0f766e;
              border-radius: 50%;
              animation: spin .8s linear infinite;
            }
            h1 { margin: 0; font-size: 24px; }
            p { color: #5f6f7c; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <main>
            <div class="folder"></div>
            <h1>Codex Research Brain</h1>
            <p>Starting your local research vault...</p>
            <div class="spinner"></div>
          </main>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }

    private func ensureBackend() {
        checkHealth { [weak self] ready in
            guard let self else { return }
            if ready {
                self.openApp()
            } else {
                self.startBackend()
            }
        }
    }

    private func startBackend() {
        let tsxPath = "\(projectPath)/node_modules/tsx/dist/cli.mjs"
        guard FileManager.default.fileExists(atPath: nodePath),
              FileManager.default.fileExists(atPath: tsxPath) else {
            showError("The local runtime is missing. Run npm install in the project folder, then reopen the app.")
            return
        }

        let logsDirectory = FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Logs/Codex Research Brain", isDirectory: true)
        try? FileManager.default.createDirectory(
            at: logsDirectory,
            withIntermediateDirectories: true
        )
        let logURL = logsDirectory.appendingPathComponent("server.log")
        if !FileManager.default.fileExists(atPath: logURL.path) {
            FileManager.default.createFile(atPath: logURL.path, contents: nil)
        }

        do {
            let handle = try FileHandle(forWritingTo: logURL)
            try handle.seekToEnd()
            logHandle = handle

            let process = Process()
            process.executableURL = URL(fileURLWithPath: nodePath)
            process.arguments = [tsxPath, "\(projectPath)/src/server/index.ts"]
            process.currentDirectoryURL = URL(fileURLWithPath: projectPath)
            var environment = ProcessInfo.processInfo.environment
            environment["NODE_ENV"] = "production"
            environment["PORT"] = "4000"
            environment["PATH"] = "\(URL(fileURLWithPath: nodePath).deletingLastPathComponent().path):/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
            process.environment = environment
            process.standardOutput = handle
            process.standardError = handle
            process.terminationHandler = { [weak self] _ in
                DispatchQueue.main.async {
                    guard let self, self.launchAttempts < 80 else { return }
                    self.showError("The local server stopped unexpectedly. See ~/Library/Logs/Codex Research Brain/server.log")
                }
            }
            try process.run()
            backendProcess = process
            ownsBackend = true
            pollUntilReady()
        } catch {
            showError("Could not start the local server: \(error.localizedDescription)")
        }
    }

    private func pollUntilReady() {
        launchAttempts += 1
        checkHealth { [weak self] ready in
            guard let self else { return }
            if ready {
                self.launchAttempts = 100
                self.openApp()
            } else if self.launchAttempts < 80 {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                    self.pollUntilReady()
                }
            } else {
                self.showError("The local server did not become ready. See ~/Library/Logs/Codex Research Brain/server.log")
            }
        }
    }

    private func checkHealth(completion: @escaping (Bool) -> Void) {
        var request = URLRequest(url: healthURL)
        request.timeoutInterval = 1
        URLSession.shared.dataTask(with: request) { data, response, _ in
            let status = (response as? HTTPURLResponse)?.statusCode
            let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            let ready = status == 200 && body.contains(projectPath)
            DispatchQueue.main.async {
                completion(ready)
            }
        }.resume()
    }

    private func openApp() {
        webView.load(URLRequest(url: appURL))
    }

    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        let panel = NSOpenPanel()
        panel.title = "Choose a Markdown File"
        panel.prompt = "Choose"
        panel.message = "Select the Markdown document to import."
        panel.canChooseFiles = true
        panel.canChooseDirectories = false
        panel.allowsMultipleSelection = false
        panel.resolvesAliases = true
        panel.allowedContentTypes = [UTType(filenameExtension: "md") ?? .plainText]

        panel.beginSheetModal(for: window) { response in
            completionHandler(response == .OK ? panel.urls : nil)
        }
    }

    private func showError(_ message: String) {
        let escaped = message
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
        webView.loadHTMLString(
            """
            <html>
            <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f3fbfa;font-family:-apple-system;color:#17212b">
              <main style="max-width:560px;padding:32px;text-align:center">
                <h1>Could not start Codex Research Brain</h1>
                <p style="color:#5f6f7c;line-height:1.6">\(escaped)</p>
              </main>
            </body>
            </html>
            """,
            baseURL: nil
        )
    }

    @objc private func reloadPage() {
        webView.reload()
    }
}

let application = NSApplication.shared
let delegate = AppDelegate()
application.delegate = delegate
application.run()
