import Foundation
import SafariServices

/// Native side of Till Morning for Safari. The page script asks for the wait rule and parks
/// baskets here; everything stays on the phone (App Group inbox, imported by the app).
class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
  func beginRequest(with context: NSExtensionContext) {
    let item = context.inputItems.first as? NSExtensionItem
    let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any] ?? [:]
    var reply: [String: Any] = [:]

    let band = (message["band"] as? String) ?? "exact"
    let price = (message["price"] as? NSNumber)?.doubleValue
    let items = (message["items"] as? NSNumber)?.intValue
    let host = message["host"] as? String

    switch message["type"] as? String {
    case "wait":
      let w = TmRules.wait(band: band, price: price)
      reply = [
        "waits": TmRules.duration(w.ready.timeIntervalSinceNow),
        "ready": TmRules.readyLabel(w.ready),
        "why": w.why,
        "work": price.map { TmRules.workTime($0) } ?? "",
      ]
    case "park":
      let what = (message["what"] as? String) ?? ""
      let p = TmInbox.park(what: what, band: band, price: price, items: items, source: "safari", host: host)
      reply = ["ok": true, "ready": TmRules.readyLabel(Date(timeIntervalSince1970: p.readyAt / 1000))]
    default:
      reply = ["ok": false]
    }

    let response = NSExtensionItem()
    response.userInfo = [SFExtensionMessageKey: reply]
    context.completeRequest(returningItems: [response], completionHandler: nil)
  }
}
