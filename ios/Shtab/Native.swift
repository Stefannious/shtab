import UIKit
import UserNotifications
import Security

/// Local reminders. The web app computes them (morning plan, pills, evening check-in)
/// and hands over the next few days; they fire on time even without internet.
enum Reminders {
    static let prefix = "shtab."

    static func status(_ done: @escaping (String) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let value: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral: value = "granted"
            case .denied: value = "denied"
            default: value = "notDetermined"
            }
            DispatchQueue.main.async { done(value) }
        }
    }

    static func request(_ done: @escaping (String) -> Void) {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            status(done)
        }
    }

    static func clear() {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { requests in
            center.removePendingNotificationRequests(withIdentifiers: requests.map { $0.identifier }.filter { $0.hasPrefix(prefix) })
        }
    }

    /// items: [{id: "shtab.2026-09-29.morning", date: "2026-09-29", time: "08:50", title, body}]
    static func set(_ items: [[String: Any]], _ done: @escaping (Int) -> Void) {
        let center = UNUserNotificationCenter.current()
        var requests: [UNNotificationRequest] = []
        let now = Date()
        for item in items.prefix(60) {
            guard let id = item["id"] as? String, id.hasPrefix(prefix),
                  let date = item["date"] as? String, let time = item["time"] as? String else { continue }
            let d = date.split(separator: "-").compactMap { Int($0) }
            let t = time.split(separator: ":").compactMap { Int($0) }
            guard d.count == 3, t.count == 2 else { continue }
            var when = DateComponents()
            when.year = d[0]; when.month = d[1]; when.day = d[2]; when.hour = t[0]; when.minute = t[1]
            guard let fire = Calendar.current.date(from: when), fire > now else { continue }
            let content = UNMutableNotificationContent()
            content.title = item["title"] as? String ?? "Штаб"
            content.body = item["body"] as? String ?? ""
            content.sound = .default
            let trigger = UNCalendarNotificationTrigger(dateMatching: when, repeats: false)
            requests.append(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
        }
        center.getPendingNotificationRequests { pendingRequests in
            let keep = Set(requests.map { $0.identifier })
            let stale = pendingRequests.map { $0.identifier }.filter { $0.hasPrefix(prefix) && !keep.contains($0) }
            center.removePendingNotificationRequests(withIdentifiers: stale)
            for request in requests { center.add(request) } // same id replaces the old one
            DispatchQueue.main.async { done(requests.count) }
        }
    }
}

enum Haptics {
    static func play(_ style: String) {
        switch style {
        case "success": UINotificationFeedbackGenerator().notificationOccurred(.success)
        case "warning": UINotificationFeedbackGenerator().notificationOccurred(.warning)
        case "error": UINotificationFeedbackGenerator().notificationOccurred(.error)
        case "select": UISelectionFeedbackGenerator().selectionChanged()
        case "medium": UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        case "heavy": UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        case "rigid": UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        case "soft": UIImpactFeedbackGenerator(style: .soft).impactOccurred()
        default: UIImpactFeedbackGenerator(style: .light).impactOccurred()
        }
    }
}

/// Keychain copy of the sync token and the NOVA key (web storage can be cleared by the system).
enum Vault {
    private static let service = "com.stefannious.shtab"
    private static let allowed: Set<String> = ["shtab-gh", "shtab-ai-key"]

    private static func query(_ key: String) -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: key]
    }

    static func get(_ key: String) -> String? {
        guard allowed.contains(key) else { return nil }
        var q = query(key)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let data = out as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func set(_ key: String, _ value: String?) {
        guard allowed.contains(key) else { return }
        SecItemDelete(query(key) as CFDictionary)
        guard let value = value, !value.isEmpty else { return }
        var q = query(key)
        q[kSecValueData as String] = Data(value.utf8)
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(q as CFDictionary, nil)
    }
}

extension UIColor {
    /// "#F4EEE4", "#abc" or "rgb(20, 18, 16)"
    convenience init?(css: String) {
        let s = css.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        var r = 0.0, g = 0.0, b = 0.0
        if s.hasPrefix("#") {
            var hex = String(s.dropFirst())
            if hex.count == 3 { hex = hex.map { "\($0)\($0)" }.joined() }
            guard hex.count == 6, let v = Int(hex, radix: 16) else { return nil }
            r = Double((v >> 16) & 255); g = Double((v >> 8) & 255); b = Double(v & 255)
        } else if s.hasPrefix("rgb") {
            let nums = s.components(separatedBy: CharacterSet(charactersIn: "0123456789.").inverted).compactMap { Double($0) }
            guard nums.count >= 3 else { return nil }
            r = nums[0]; g = nums[1]; b = nums[2]
        } else {
            return nil
        }
        self.init(red: r / 255, green: g / 255, blue: b / 255, alpha: 1)
    }
}
