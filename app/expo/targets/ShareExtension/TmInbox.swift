import Foundation
import UIKit
import UserNotifications
import Vision

// Shared with targets/SafariExtension/TmInbox.swift — keep the two copies identical.
// Wants parked outside the app go into the App Group inbox; Till Morning imports them on launch.

let TM_GROUP = "group.com.andrej.tillmorning"
let TM_INBOX_KEY = "tm_inbox"

struct TmParked: Codable {
  var id: String
  var what: String
  var band: String  // unsure | under20 | 20to50 | 50to100 | over100 | exact
  var price: Double?
  var items: Int?
  var parkedAt: Double  // ms since 1970
  var readyAt: Double  // ms since 1970
  var source: String  // share | safari
  var host: String?
}

enum TmRules {
  static var defaults: UserDefaults? { UserDefaults(suiteName: TM_GROUP) }

  static var sale: Bool { defaults?.bool(forKey: "tm_sale") ?? false }
  static var wage: Double {
    let w = defaults?.double(forKey: "tm_wage") ?? 0
    return w > 0 ? w : 12
  }

  static let bandHours: [String: Double] = ["under20": 1, "20to50": 3, "50to100": 8, "over100": 12]
  static let bandLabel: [String: String] = [
    "unsure": "Not sure", "under20": "Under £20", "20to50": "£20 to £50", "50to100": "£50 to £100", "over100": "Over £100",
  ]

  static func next8am(after date: Date) -> Date {
    let cal = Calendar.current
    var d = cal.date(bySettingHour: 8, minute: 0, second: 0, of: date) ?? date
    if d <= date { d = cal.date(byAdding: .day, value: 1, to: d) ?? d }
    return d
  }

  /// The Till Morning rule: 1 hour for every £10 (1 hour up to £20), doubled in sale week;
  /// never ready at night (22:00–08:00 moves to 08:00); not sure → 08:00.
  static func wait(band: String, price: Double?, from now: Date = Date()) -> (ready: Date, why: [String]) {
    var why: [String] = []
    if band == "unsure" {
      why.append("Not sure? It waits till 08:00")
      return (next8am(after: now), why)
    }
    var hours: Double
    if band == "exact", let p = price {
      hours = p <= 20 ? 1 : (p / 10).rounded()
      why.append(p <= 20 ? "£20 or less: 1 h" : "£\(Int(p.rounded())): \(Int(hours)) h")
    } else {
      hours = bandHours[band] ?? 1
      why.append("\(bandLabel[band] ?? band): \(Int(hours)) h")
    }
    if sale {
      hours *= 2
      why.append("Sale week: ×2")
    }
    var ready = now.addingTimeInterval(hours * 3600)
    let h = Calendar.current.component(.hour, from: ready)
    if h >= 22 || h < 8 {
      ready = next8am(after: ready)
      why.append("Ready at night? 08:00")
    }
    return (ready, why)
  }

  static func duration(_ seconds: Double) -> String {
    let mins = max(1, Int((seconds / 60).rounded()))
    let h = mins / 60, m = mins % 60
    if h == 0 { return "\(m) min" }
    return m == 0 ? "\(h) h" : "\(h) h \(m) min"
  }

  static func readyLabel(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_GB")
    f.dateFormat = "HH:mm"
    let cal = Calendar.current
    if cal.isDateInToday(date) { return "\(f.string(from: date)) today" }
    if cal.isDateInTomorrow(date) { return "\(f.string(from: date)) tomorrow" }
    let w = DateFormatter()
    w.locale = Locale(identifier: "en_GB")
    w.dateFormat = "EEEE"
    return "\(f.string(from: date)) \(w.string(from: date))"
  }

  static func workTime(_ price: Double) -> String { duration(price / wage * 3600) }

  static func money(_ v: Double) -> String {
    v.truncatingRemainder(dividingBy: 1) == 0 ? "£\(Int(v))" : String(format: "£%.2f", v)
  }
}

enum TmInbox {
  /// Saves a parked want for the app to import, and schedules its "ready" notification.
  @discardableResult
  static func park(what: String, band: String, price: Double?, items: Int?, source: String, host: String?) -> TmParked {
    let now = Date()
    let (ready, _) = TmRules.wait(band: band, price: band == "exact" ? price : nil, from: now)
    let entry = TmParked(
      id: String(Int(now.timeIntervalSince1970 * 1000)),
      what: what,
      band: band,
      price: band == "exact" ? price : nil,
      items: items,
      parkedAt: now.timeIntervalSince1970 * 1000,
      readyAt: ready.timeIntervalSince1970 * 1000,
      source: source,
      host: host
    )
    var list: [TmParked] = []
    if let raw = TmRules.defaults?.string(forKey: TM_INBOX_KEY), let data = raw.data(using: .utf8),
      let parsed = try? JSONDecoder().decode([TmParked].self, from: data)
    {
      list = parsed
    }
    list.append(entry)
    if let data = try? JSONEncoder().encode(list), let s = String(data: data, encoding: .utf8) {
      TmRules.defaults?.set(s, forKey: TM_INBOX_KEY)
    }

    // Same identifier the app uses (tm_park_<id>), so the app can replace or cancel it.
    let content = UNMutableNotificationContent()
    content.title = "Till Morning"
    content.body = "\(what.isEmpty ? "Your parked basket" : what) is ready. Still want it? Tap to decide."
    content.sound = .default
    content.userInfo = ["url": "tillmorning://decide?id=\(entry.id)"]
    let interval = max(5, ready.timeIntervalSinceNow)
    let request = UNNotificationRequest(
      identifier: "tm_park_\(entry.id)", content: content,
      trigger: UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false))
    UNUserNotificationCenter.current().add(request)
    return entry
  }
}

enum TmOCR {
  /// Lines of text in an image, read on this device.
  static func lines(in image: UIImage, completion: @escaping ([String]) -> Void) {
    guard let cg = image.cgImage else { return completion([]) }
    DispatchQueue.global(qos: .userInitiated).async {
      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.usesLanguageCorrection = false
      let handler = VNImageRequestHandler(cgImage: cg, options: [:])
      try? handler.perform([request])
      let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
      DispatchQueue.main.async { completion(lines) }
    }
  }

  private static func amounts(_ line: String) -> [Double] {
    let pattern = #"(?:£|GBP\s?|\$|€)\s?(\d{1,5}(?:[.,]\d{1,2})?)|(?:^|[^\d.,£$€])(\d{1,5}[.,]\d{2})(?!\d)"#
    guard let re = try? NSRegularExpression(pattern: pattern) else { return [] }
    let ns = line as NSString
    return re.matches(in: line, range: NSRange(location: 0, length: ns.length)).compactMap { m in
      for i in 1...2 {
        let r = m.range(at: i)
        if r.location != NSNotFound {
          return Double(ns.substring(with: r).replacingOccurrences(of: ",", with: "."))
        }
      }
      return nil
    }.filter { $0 > 0 }
  }

  /// The order total (same rules as the app's findTotal()).
  static func total(_ lines: [String]) -> Double? {
    let isTotal = try? NSRegularExpression(pattern: #"\btotal\b|amount to pay|you pay|to pay"#, options: .caseInsensitive)
    let notTotal = try? NSRegularExpression(
      pattern: #"sub-?total|items total|saving|discount|delivery|postage|shipping|vat|tax|before"#, options: .caseInsensitive)
    func matches(_ re: NSRegularExpression?, _ s: String) -> Bool {
      re?.firstMatch(in: s, range: NSRange(location: 0, length: (s as NSString).length)) != nil
    }
    // Discounts show a struck-through old price, then the price you pay: take the last one.
    func priceOnly(_ s: String) -> Bool {
      let letters = s.unicodeScalars.filter { CharacterSet.letters.contains($0) }.count
      return !amounts(s).isEmpty && letters <= 2
    }
    for i in stride(from: lines.count - 1, through: 0, by: -1) {
      let l = lines[i]
      guard matches(isTotal, l), !matches(notTotal, l) else { continue }
      var found = amounts(l)
      var j = i + 1
      while j < min(lines.count, i + 4), priceOnly(lines[j]) {
        found.append(contentsOf: amounts(lines[j]))
        j += 1
      }
      if let last = found.last { return last }
    }
    let skip = try? NSRegularExpression(pattern: #"subtotal|saving|was|rrp|save"#, options: .caseInsensitive)
    let best = lines.filter { !matches(skip, $0) }.flatMap { amounts($0) }.max()
    return best
  }

  static func itemCount(_ lines: [String]) -> Int? {
    let re = try? NSRegularExpression(pattern: #"\b(\d{1,2})\s+items?\b|\b(?:basket|bag|cart)\s*\((\d{1,2})\)"#, options: .caseInsensitive)
    for l in lines {
      let ns = l as NSString
      if let m = re?.firstMatch(in: l, range: NSRange(location: 0, length: ns.length)) {
        for i in 1...2 where m.range(at: i).location != NSNotFound {
          return Int(ns.substring(with: m.range(at: i)))
        }
      }
    }
    return nil
  }
}
