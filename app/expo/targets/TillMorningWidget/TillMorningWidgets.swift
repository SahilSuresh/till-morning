import ActivityKit
import SwiftUI
import WidgetKit

// MARK: - Shared with the app (keep identical to modules/tm-native/ios/TmPassActivity.swift)

/// A running Shopping Pass. The countdown ticks on its own; the app only starts and ends it.
struct TmPassAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var startedAt: Date
    var endsAt: Date
  }
  var title: String
  var need: String
}

// MARK: - Colours (Till Morning night theme)

private func tmColor(_ hex: UInt32, _ alpha: Double = 1) -> Color {
  Color(
    red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255,
    blue: Double(hex & 0xFF) / 255, opacity: alpha)
}

private let tmNight = tmColor(0x0D0F2E)
private let tmCard = tmColor(0x1C2057)
private let tmText = tmColor(0xF3F2FF)
private let tmText2 = tmColor(0xB4B6E4)
private let tmViolet = tmColor(0x7E3FF2)
private let tmPink = tmColor(0xB455F0)
private let tmMoon = tmColor(0xFFE7A3)
private let tmMint = tmColor(0x5EE9B5)
private let tmLilac = tmColor(0xC4B5FD)

// MARK: - Waiting room widgets

/// Written by the app to the App Group as JSON under "tm_widget".
struct TmWidgetData: Codable {
  var readyAts: [Double] = []  // ms since 1970, one per parked want still undecided
  var subscribed: Bool = false
  var nlOn: Bool = true
  var nlFrom: Int = 23
  var nlTo: Int = 7
}

private func tmLoadData() -> TmWidgetData {
  guard let raw = UserDefaults(suiteName: "group.com.andrej.tillmorning")?.string(forKey: "tm_widget"),
    let data = raw.data(using: .utf8),
    let parsed = try? JSONDecoder().decode(TmWidgetData.self, from: data)
  else { return TmWidgetData() }
  return parsed
}

private func tmHH(_ h: Int) -> String { String(format: "%02d:00", h) }

private func tmNightActive(_ d: TmWidgetData, at date: Date) -> Bool {
  guard d.nlOn else { return false }
  let h = Calendar.current.component(.hour, from: date)
  return d.nlFrom > d.nlTo ? (h >= d.nlFrom || h < d.nlTo) : (h >= d.nlFrom && h < d.nlTo)
}

struct TmEntry: TimelineEntry {
  let date: Date
  let data: TmWidgetData
}

struct TmProvider: TimelineProvider {
  func placeholder(in context: Context) -> TmEntry {
    TmEntry(date: Date(), data: TmWidgetData(readyAts: [0, Date().addingTimeInterval(3600).timeIntervalSince1970 * 1000], subscribed: true))
  }

  func getSnapshot(in context: Context, completion: @escaping (TmEntry) -> Void) {
    completion(TmEntry(date: Date(), data: context.isPreview ? placeholder(in: context).data : tmLoadData()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TmEntry>) -> Void) {
    let data = tmLoadData()
    let now = Date()
    // One entry per hour for the next 12 hours, so the night-lock line flips on time.
    var entries: [TmEntry] = [TmEntry(date: now, data: data)]
    let cal = Calendar.current
    if let nextHour = cal.nextDate(after: now, matching: DateComponents(minute: 0), matchingPolicy: .nextTime) {
      for i in 0..<12 {
        if let d = cal.date(byAdding: .hour, value: i, to: nextHour) { entries.append(TmEntry(date: d, data: data)) }
      }
    }
    // Plus the moment each parked want becomes ready.
    let horizon = now.addingTimeInterval(12 * 3600)
    for t in data.readyAts {
      let d = Date(timeIntervalSince1970: t / 1000)
      if d > now && d < horizon { entries.append(TmEntry(date: d, data: data)) }
    }
    entries.sort { $0.date < $1.date }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

private func tmCount(_ d: TmWidgetData, at date: Date) -> (Int, String) {
  let t = date.timeIntervalSince1970 * 1000
  let ready = d.readyAts.filter { $0 <= t }.count
  return ready > 0 ? (ready, "ready to decide") : (d.readyAts.count - ready, "parked till morning")
}

struct TmHomeView: View {
  let entry: TmEntry
  var body: some View {
    let (n, label) = tmCount(entry.data, at: entry.date)
    let night = tmNightActive(entry.data, at: entry.date)
    VStack(alignment: .leading, spacing: 4) {
      HStack(spacing: 6) {
        Image(systemName: "moon.zzz.fill").foregroundStyle(tmLilac).font(.system(size: 13, weight: .bold))
        Text("Till Morning").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(tmText2)
      }
      Spacer(minLength: 0)
      Text("\(n)").font(.system(size: 40, weight: .bold, design: .rounded)).foregroundStyle(tmText)
      Text(label).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(tmText2)
      if entry.data.nlOn {
        Text(night ? "Locked till \(tmHH(entry.data.nlTo))" : "Night lock \(tmHH(entry.data.nlFrom))")
          .font(.system(size: 11, weight: .bold, design: .rounded))
          .foregroundStyle(tmLilac)
          .padding(.horizontal, 8).padding(.vertical, 3)
          .background(Capsule().fill(tmCard))
          .padding(.top, 2)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .widgetURL(URL(string: "tillmorning://waiting"))
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("Till Morning widget: \(n) \(label)")
  }
}

struct TmLockView: View {
  let entry: TmEntry
  var body: some View {
    let (n, label) = tmCount(entry.data, at: entry.date)
    let night = tmNightActive(entry.data, at: entry.date)
    HStack(spacing: 8) {
      Image(systemName: "moon.fill").font(.system(size: 20, weight: .bold))
      VStack(alignment: .leading, spacing: 1) {
        Text("\(n) \(label)").font(.system(size: 15, weight: .bold, design: .rounded)).lineLimit(1)
        Text(
          !entry.data.nlOn
            ? "Till Morning"
            : night ? "Night lock till \(tmHH(entry.data.nlTo))" : "Night lock from \(tmHH(entry.data.nlFrom))"
        )
        .font(.system(size: 13, weight: .medium, design: .rounded)).lineLimit(1)
      }
    }
    .widgetURL(URL(string: "tillmorning://waiting"))
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("Till Morning widget: \(n) \(label)")
  }
}

struct TmWaitingWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "TmWaitingWidget", provider: TmProvider()) { entry in
      TmWidgetRouter(entry: entry)
    }
    .configurationDisplayName("Waiting room")
    .description("What's parked till morning, and when night lock starts.")
    .supportedFamilies([.systemSmall, .accessoryRectangular])
  }
}

struct TmWidgetRouter: View {
  @Environment(\.widgetFamily) var family
  let entry: TmEntry
  var body: some View {
    if family == .accessoryRectangular {
      TmLockView(entry: entry).containerBackground(for: .widget) { Color.clear }
    } else {
      TmHomeView(entry: entry).containerBackground(for: .widget) {
        LinearGradient(colors: [tmColor(0x1B1E5C), tmNight], startPoint: .top, endPoint: .bottom)
      }
    }
  }
}

// MARK: - Shopping Pass Live Activity

/// The ticket badge: violet-to-pink, like the Shopping Pass ticket in the app.
struct TmTicketBadge: View {
  var size: CGFloat = 44
  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: size * 0.28, style: .continuous)
        .fill(LinearGradient(colors: [tmViolet, tmPink], startPoint: .topLeading, endPoint: .bottomTrailing))
      Image(systemName: "ticket.fill").font(.system(size: size * 0.42, weight: .bold)).foregroundStyle(.white)
    }
    .frame(width: size, height: size)
  }
}

/// Lock Screen: which pass (the app), what you came for and your limit, a big moon-yellow
/// countdown, a progress bar, and the time the app locks again. Night Trolley colours.
struct TmPassLockScreen: View {
  let context: ActivityViewContext<TmPassAttributes>
  var body: some View {
    let s = context.state
    let over = context.isStale || s.endsAt <= Date()
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .center, spacing: 12) {
        TmTicketBadge()
        VStack(alignment: .leading, spacing: 2) {
          Text(context.attributes.title).font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(tmText).lineLimit(1)
          if !context.attributes.need.isEmpty {
            Text(context.attributes.need).font(.system(size: 13, weight: .medium, design: .rounded))
              .foregroundStyle(tmText2).lineLimit(1)
          }
        }
        Spacer(minLength: 0)
        if over {
          Text("Locked again").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(tmMoon)
        } else {
          VStack(alignment: .trailing, spacing: 0) {
            Text(timerInterval: s.startedAt...s.endsAt, countsDown: true)
              .font(.system(size: 30, weight: .bold, design: .rounded)).monospacedDigit()
              .foregroundStyle(tmMoon).multilineTextAlignment(.trailing).frame(width: 104, alignment: .trailing)
            Text("left").font(.system(size: 11, weight: .semibold, design: .rounded)).foregroundStyle(tmText2)
          }
        }
      }
      ProgressView(timerInterval: s.startedAt...s.endsAt, countsDown: true) { EmptyView() } currentValueLabel: { EmptyView() }
        .tint(tmMoon)
      HStack(spacing: 6) {
        Image(systemName: "lock.fill").font(.system(size: 11, weight: .bold)).foregroundStyle(tmText2)
        (Text("Locks again at ") + Text(s.endsAt, style: .time))
          .font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundStyle(tmText2)
        Spacer(minLength: 0)
        Image(systemName: "moon.stars.fill").font(.system(size: 11, weight: .bold)).foregroundStyle(tmMoon)
        Text("Till Morning").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(tmText2)
      }
    }
    .padding(16)
    .activityBackgroundTint(tmCard)
    .activitySystemActionForegroundColor(tmText)
  }
}

struct TmPassActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: TmPassAttributes.self) { context in
      TmPassLockScreen(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          HStack(spacing: 8) {
            TmTicketBadge(size: 30)
            Text(context.attributes.title).font(.system(size: 14, weight: .bold, design: .rounded)).lineLimit(1)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(timerInterval: context.state.startedAt...context.state.endsAt, countsDown: true)
            .font(.system(size: 22, weight: .bold, design: .rounded)).monospacedDigit().foregroundStyle(tmMoon)
            .multilineTextAlignment(.trailing).frame(width: 84, alignment: .trailing)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 6) {
            if !context.attributes.need.isEmpty {
              Text(context.attributes.need).font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundStyle(tmText2).lineLimit(1)
            }
            ProgressView(timerInterval: context.state.startedAt...context.state.endsAt, countsDown: true) {
              EmptyView()
            } currentValueLabel: {
              EmptyView()
            }
            .tint(tmMoon)
            (Text("Locks again at ") + Text(context.state.endsAt, style: .time))
              .font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundStyle(tmText2)
          }
        }
      } compactLeading: {
        Image(systemName: "ticket.fill").foregroundStyle(tmPink)
      } compactTrailing: {
        Text(timerInterval: context.state.startedAt...context.state.endsAt, countsDown: true)
          .monospacedDigit().font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(tmMoon)
          .frame(width: 48, alignment: .trailing)
      } minimal: {
        Image(systemName: "ticket.fill").foregroundStyle(tmPink)
      }
      .widgetURL(URL(string: "tillmorning://"))
      .keylineTint(tmPink)
    }
  }
}

// MARK: - Bundle

@main
struct TillMorningWidgets: WidgetBundle {
  var body: some Widget {
    TmWaitingWidget()
    TmPassActivity()
  }
}
