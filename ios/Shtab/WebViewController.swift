import UIKit
import WebKit
import Network

/// Full-screen web view with the Штаб web app plus a small bridge (window.webkit.messageHandlers.shtab)
/// for haptics, local reminders, keeping the screen on, sharing files and the Keychain.
final class WebViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandlerWithReply {
    static let home = URL(string: "https://stefannious.github.io/shtab/")!
    static let version = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    static let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"

    private var webView: WKWebView!
    private let offlineView = OfflineView()
    private let spinner = UIActivityIndicatorView(style: .medium)
    private let monitor = NWPathMonitor()
    private var loaded = false
    private var pending: [String] = []
    private var darkContent: Bool?

    override var preferredStatusBarStyle: UIStatusBarStyle {
        guard let dark = darkContent else { return .default }
        return dark ? .lightContent : .darkContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let background = UIColor(named: "LaunchBackground") ?? .systemBackground
        view.backgroundColor = background

        let config = WKWebViewConfiguration()
        config.limitsNavigationsToAppBoundDomains = true
        config.allowsInlineMediaPlayback = true
        config.dataDetectorTypes = []
        config.applicationNameForUserAgent = "Shtab/\(Self.version) Mobile/15E148"
        let content = WKUserContentController()
        content.addScriptMessageHandler(self, contentWorld: .page, name: "shtab")
        content.addUserScript(WKUserScript(source: "window.SHTAB_NATIVE={platform:'ios',version:'\(Self.version)',build:'\(Self.build)'};",
                                           injectionTime: .atDocumentStart, forMainFrameOnly: true))
        content.addUserScript(WKUserScript(source: Self.viewportScript, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        config.userContentController = content

        let web = WKWebView(frame: view.bounds, configuration: config)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.navigationDelegate = self
        web.uiDelegate = self
        web.isOpaque = false
        web.backgroundColor = background
        web.scrollView.backgroundColor = background
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsBackForwardNavigationGestures = false
        web.allowsLinkPreview = false
        web.alpha = 0
        if #available(iOS 16.4, *) { web.isInspectable = true }
        view.addSubview(web)
        webView = web

        offlineView.frame = view.bounds
        offlineView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        offlineView.isHidden = true
        offlineView.onRetry = { [weak self] in self?.load() }
        view.addSubview(offlineView)

        spinner.hidesWhenStopped = true
        spinner.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(spinner)
        NSLayoutConstraint.activate([
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -48),
        ])

        load()
        monitor.pathUpdateHandler = { [weak self] path in
            guard path.status == .satisfied else { return }
            DispatchQueue.main.async {
                guard let self = self, !self.loaded, !self.offlineView.isHidden else { return }
                self.load()
            }
        }
        monitor.start(queue: DispatchQueue(label: "shtab.network"))
    }

    private func load() {
        offlineView.isHidden = true
        webView.load(URLRequest(url: Self.home))
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) { [weak self] in
            guard let self = self, !self.loaded, self.offlineView.isHidden else { return }
            self.spinner.startAnimating()
        }
    }

    /// shtab://pair?c=shtab1:… — connect sync from a link (e.g. a QR code shown on the Mac).
    func handle(url: URL) {
        guard url.scheme?.lowercased() == "shtab" else { return }
        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        if url.host == "pair", let code = items.first(where: { $0.name == "c" })?.value, code.hasPrefix("shtab1:") {
            let allowed = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_:")
            guard code.unicodeScalars.allSatisfy({ allowed.contains($0) }) else { return }
            run("location.hash='pair=\(code)';location.reload();")
        }
    }

    private func run(_ js: String) {
        if loaded, let web = webView { web.evaluateJavaScript(js, completionHandler: nil) } else { pending.append(js) }
    }

    // MARK: bridge

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        guard let body = message.body as? [String: Any], let cmd = body["cmd"] as? String else {
            replyHandler(nil, "bad message"); return
        }
        switch cmd {
        case "hello":
            replyHandler(["platform": "ios", "version": Self.version, "build": Self.build], nil)
        case "haptic":
            Haptics.play(body["style"] as? String ?? "light"); replyHandler(true, nil)
        case "awake":
            UIApplication.shared.isIdleTimerDisabled = (body["on"] as? Bool) ?? false; replyHandler(true, nil)
        case "theme":
            applyTheme(background: body["bg"] as? String, dark: body["dark"] as? Bool); replyHandler(true, nil)
        case "share":
            share(name: body["name"] as? String ?? "shtab.json", text: body["text"] as? String ?? ""); replyHandler(true, nil)
        case "open":
            if let raw = body["url"] as? String {
                let url = raw == "app-settings:" ? URL(string: UIApplication.openSettingsURLString) : URL(string: raw)
                if let url = url, ["https", "http", "mailto", "tel", "app-settings"].contains((url.scheme ?? "").lowercased()) {
                    UIApplication.shared.open(url)
                }
            }
            replyHandler(true, nil)
        case "notif.status":
            Reminders.status { replyHandler($0, nil) }
        case "notif.request":
            Reminders.request { replyHandler($0, nil) }
        case "notif.set":
            Reminders.set(body["items"] as? [[String: Any]] ?? []) { replyHandler($0, nil) }
        case "notif.clear":
            Reminders.clear(); replyHandler(true, nil)
        case "store.get":
            replyHandler(Vault.get(body["key"] as? String ?? ""), nil)
        case "store.set":
            Vault.set(body["key"] as? String ?? "", body["value"] as? String); replyHandler(true, nil)
        default:
            replyHandler(nil, "unknown command: \(cmd)")
        }
    }

    private func applyTheme(background: String?, dark: Bool?) {
        if let css = background, let color = UIColor(css: css) {
            view.backgroundColor = color
            view.window?.backgroundColor = color
            webView.backgroundColor = color
            webView.scrollView.backgroundColor = color
            webView.underPageBackgroundColor = color
        }
        if let dark = dark, dark != darkContent {
            darkContent = dark
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    private func share(name: String, text: String) {
        var safe = name.replacingOccurrences(of: "/", with: "-").replacingOccurrences(of: ":", with: "-")
        if safe.isEmpty { safe = "shtab.json" }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(safe)
        do { try Data(text.utf8).write(to: url, options: .atomic) } catch { return }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        if let popover = sheet.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.maxY - 100, width: 1, height: 1)
        }
        (presentedViewController ?? self).present(sheet, animated: true)
    }

    // MARK: navigation

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        let scheme = (url.scheme ?? "").lowercased()
        if ["about", "blob", "data"].contains(scheme) { decisionHandler(.allow); return }
        if scheme == "https", url.host == Self.home.host { decisionHandler(.allow); return }
        // GitHub, Anthropic console, mail links and everything else open outside the app.
        if navigationAction.targetFrame == nil || navigationAction.targetFrame?.isMainFrame == true {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loaded = true
        spinner.stopAnimating()
        offlineView.isHidden = true
        UIView.animate(withDuration: 0.2) { webView.alpha = 1 }
        let scripts = pending
        pending.removeAll()
        for js in scripts { webView.evaluateJavaScript(js, completionHandler: nil) }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        failed(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        failed(error)
    }

    private func failed(_ error: Error) {
        let e = error as NSError
        if e.domain == NSURLErrorDomain && e.code == NSURLErrorCancelled { return }
        if e.domain == "WebKitErrorDomain" && e.code == 102 { return } // navigation handed to another app
        if loaded { return }
        spinner.stopAnimating()
        offlineView.isHidden = false
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.reload()
    }

    // MARK: UI

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            if url.host == Self.home.host { webView.load(navigationAction.request) } else { UIApplication.shared.open(url) }
        }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard presentedViewController == nil else { completionHandler(); return }
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard presentedViewController == nil else { completionHandler(false); return }
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: OfflineView.ru ? "Отмена" : "Cancel", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    private static let viewportScript = """
    (function(){var m=document.querySelector('meta[name=viewport]');if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m);}
    m.content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';})();
    """
}

/// Shown only when the very first launch happens without internet.
final class OfflineView: UIView {
    static let ru: Bool = {
        let lang = Locale.preferredLanguages.first ?? "ru"
        return lang.hasPrefix("ru") || lang.hasPrefix("uk") || lang.hasPrefix("be") || lang.hasPrefix("kk")
    }()
    var onRetry: (() -> Void)?

    override init(frame: CGRect) {
        super.init(frame: frame)
        let title = UILabel()
        title.text = Self.ru ? "Нет связи" : "No connection"
        title.font = .systemFont(ofSize: 22, weight: .semibold)
        title.textAlignment = .center

        let text = UILabel()
        text.text = Self.ru
            ? "Штаб загрузится, как только появится интернет. После первого запуска он работает и без сети."
            : "Shtab will load as soon as you are online. After the first launch it also works offline."
        text.font = .systemFont(ofSize: 15)
        text.textColor = .secondaryLabel
        text.textAlignment = .center
        text.numberOfLines = 0

        var config = UIButton.Configuration.filled()
        config.title = Self.ru ? "Повторить" : "Try again"
        config.cornerStyle = .capsule
        config.baseBackgroundColor = UIColor(red: 0.76, green: 0.60, blue: 0.37, alpha: 1)
        config.contentInsets = NSDirectionalEdgeInsets(top: 12, leading: 28, bottom: 12, trailing: 28)
        let button = UIButton(configuration: config, primaryAction: UIAction { [weak self] _ in self?.onRetry?() })

        let stack = UIStackView(arrangedSubviews: [title, text, button])
        stack.axis = .vertical
        stack.spacing = 14
        stack.alignment = .center
        stack.setCustomSpacing(24, after: text)
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerYAnchor.constraint(equalTo: centerYAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 32),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -32),
            text.widthAnchor.constraint(equalTo: stack.widthAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not used") }
}
