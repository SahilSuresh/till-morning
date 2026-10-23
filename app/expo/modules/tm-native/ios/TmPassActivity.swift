import ActivityKit
import Foundation
import WidgetKit

// Keep identical to targets/TillMorningWidget/TillMorningWidgets.swift: iOS matches the
// Live Activity to the widget by this type's name and shape.
struct TmPassAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var startedAt: Date
    var endsAt: Date
  }
  var title: String
  var need: String
}

enum TmLive {
  /// Starts the Shopping Pass countdown on the Lock Screen and in the Dynamic Island.
  static func start(title: String, need: String, startedAt: Double, endsAt: Double) -> Bool {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
    endAll()
    let start = Date(timeIntervalSince1970: startedAt / 1000)
    let end = Date(timeIntervalSince1970: endsAt / 1000)
    let attributes = TmPassAttributes(title: title, need: need)
    let state = TmPassAttributes.ContentState(startedAt: start, endsAt: end)
    do {
      _ = try Activity.request(
        attributes: attributes,
        content: ActivityContent(state: state, staleDate: end),
        pushType: nil
      )
      return true
    } catch {
      return false
    }
  }

  /// Ends every pass countdown (pass ended, ended early, or the plan lapsed).
  static func endAll() {
    for activity in Activity<TmPassAttributes>.activities {
      Task {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }

  static func reloadWidgets() {
    WidgetCenter.shared.reloadAllTimelines()
  }
}
