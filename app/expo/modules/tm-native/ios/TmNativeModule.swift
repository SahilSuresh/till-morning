import ExpoModulesCore
import FamilyControls
import ImageIO
import ManagedSettings
import SwiftUI
import UIKit
import Vision

// Same App Group and storage key react-native-device-activity uses for selections saved by id.
let TM_APP_GROUP = "group.com.andrej.tillmorning"
let TM_SELECTION_IDS_KEY = "familyActivitySelectionIds"

private func tmDefaults() -> UserDefaults? {
  return UserDefaults(suiteName: TM_APP_GROUP)
}

private func tmLoadSelection(_ id: String) -> FamilyActivitySelection? {
  guard let dict = tmDefaults()?.dictionary(forKey: TM_SELECTION_IDS_KEY),
    let str = dict[id] as? String,
    let data = Data(base64Encoded: str)
  else { return nil }
  return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
}

private func tmSaveSelection(_ selection: FamilyActivitySelection, id: String) -> Bool {
  guard let ud = tmDefaults(), let data = try? JSONEncoder().encode(selection) else { return false }
  var dict = ud.dictionary(forKey: TM_SELECTION_IDS_KEY) ?? [:]
  dict[id] = data.base64EncodedString()
  ud.set(dict, forKey: TM_SELECTION_IDS_KEY)
  return true
}

/// An app's key: its token, JSON-encoded then base64. The shield extensions key apps the same way.
func tmEncodeToken(_ token: ApplicationToken) -> String? {
  guard let data = try? JSONEncoder().encode(token) else { return nil }
  return data.base64EncodedString()
}

func tmDecodeToken(_ key: String) -> ApplicationToken? {
  guard let data = Data(base64Encoded: key) else { return nil }
  return try? JSONDecoder().decode(ApplicationToken.self, from: data)
}

private func tmOrientation(_ o: UIImage.Orientation) -> CGImagePropertyOrientation {
  switch o {
  case .up: return .up
  case .down: return .down
  case .left: return .left
  case .right: return .right
  case .upMirrored: return .upMirrored
  case .downMirrored: return .downMirrored
  case .leftMirrored: return .leftMirrored
  case .rightMirrored: return .rightMirrored
  @unknown default: return .up
  }
}

private func tmColor(_ hex: String?) -> Color {
  guard var s = hex?.trimmingCharacters(in: .whitespaces), s.hasPrefix("#") else { return .white }
  s.removeFirst()
  guard s.count == 6, let v = UInt64(s, radix: 16) else { return .white }
  return Color(
    red: Double((v >> 16) & 0xFF) / 255.0,
    green: Double((v >> 8) & 0xFF) / 255.0,
    blue: Double(v & 0xFF) / 255.0
  )
}

public class TmNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TmNative")

    // Every app in a saved selection, one key each (sorted so the order is stable).
    Function("appKeys") { (selectionId: String) -> [String] in
      guard let selection = tmLoadSelection(selectionId) else { return [] }
      return selection.applicationTokens.compactMap { tmEncodeToken($0) }.sorted()
    }

    // Saves a selection holding exactly these apps under an id (a one-app pass, a single app's shield).
    Function("saveAppsSelection") { (keys: [String], id: String) -> Bool in
      var selection = FamilyActivitySelection()
      for key in keys {
        if let token = tmDecodeToken(key) { selection.applicationTokens.insert(token) }
      }
      return tmSaveSelection(selection, id: id)
    }

    // Adds or removes apps in a saved selection, keeping its categories and websites. Returns the app count.
    Function("editApps") { (selectionId: String, add: [String], remove: [String]) -> Int in
      guard var selection = tmLoadSelection(selectionId) else { return -1 }
      for key in remove {
        if let token = tmDecodeToken(key) { selection.applicationTokens.remove(token) }
      }
      for key in add {
        if let token = tmDecodeToken(key) { selection.applicationTokens.insert(token) }
      }
      _ = tmSaveSelection(selection, id: selectionId)
      return selection.applicationTokens.count
    }

    // On-device text recognition (Vision) for checkout and basket screenshots. Nothing leaves the phone.
    AsyncFunction("recognizeText") { (uri: String, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        let url = URL(string: uri) ?? URL(fileURLWithPath: uri)
        guard let data = try? Data(contentsOf: url),
          let image = UIImage(data: data),
          let cgImage = image.cgImage
        else {
          promise.reject("E_IMAGE", "Couldn't read that image")
          return
        }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = false
        let handler = VNImageRequestHandler(
          cgImage: cgImage, orientation: tmOrientation(image.imageOrientation), options: [:])
        do {
          try handler.perform([request])
          let lines: [String] = (request.results ?? []).compactMap { observation in
            observation.topCandidates(1).first?.string
          }
          promise.resolve(lines)
        } catch {
          promise.reject("E_OCR", error.localizedDescription)
        }
      }
    }

    // Shopping Pass countdown on the Lock Screen / Dynamic Island (times in ms since 1970).
    Function("startPassActivity") { (title: String, need: String, startedAt: Double, endsAt: Double) -> Bool in
      return TmLive.start(title: title, need: need, startedAt: startedAt, endsAt: endsAt)
    }

    Function("endPassActivities") {
      TmLive.endAll()
    }

    // Floating countdown over other apps (Picture in Picture) for a running pass.
    Function("startPassPip") { (title: String, startedAt: Double, endsAt: Double) -> Bool in
      guard TmPipTimer.isSupported else { return false }
      TmPipTimer.shared.start(title: title, startedAt: startedAt, endsAt: endsAt)
      return true
    }

    Function("stopPassPip") {
      TmPipTimer.shared.stop()
    }

    // Widgets read "tm_widget" from the App Group; this asks iOS to redraw them now.
    Function("reloadWidgets") {
      TmLive.reloadWidgets()
    }

    // Apple's own app name and icon for a token. Only iOS can draw these; the app never sees the name.
    View(TmAppLabelView.self) {
      Prop("appKey") { (view: TmAppLabelView, key: String?) in
        view.model.key = key
      }
      Prop("mode") { (view: TmAppLabelView, mode: String?) in
        view.model.mode = mode ?? "both"
      }
      Prop("size") { (view: TmAppLabelView, size: Double?) in
        view.model.size = size ?? 17
      }
      Prop("iconScale") { (view: TmAppLabelView, scale: Double?) in
        view.model.iconScale = scale ?? 1
      }
      Prop("color") { (view: TmAppLabelView, hex: String?) in
        view.model.color = tmColor(hex)
      }
      Prop("align") { (view: TmAppLabelView, align: String?) in
        view.model.align = align ?? "leading"
      }
    }
  }
}

final class TmAppLabelModel: ObservableObject {
  @Published var key: String? = nil
  @Published var mode: String = "both"
  @Published var size: Double = 17
  @Published var iconScale: Double = 1
  @Published var color: Color = .white
  @Published var align: String = "leading"
}

struct TmAppLabel: View {
  @ObservedObject var model: TmAppLabelModel

  var body: some View {
    HStack(spacing: 0) {
      if model.align != "leading" { Spacer(minLength: 0) }
      if let key = model.key, let token = tmDecodeToken(key) {
        styled(token)
      }
      if model.align != "trailing" { Spacer(minLength: 0) }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
  }

  @ViewBuilder
  private func styled(_ token: ApplicationToken) -> some View {
    if model.mode == "title" {
      Label(token)
        .labelStyle(.titleOnly)
        .font(.system(size: model.size, weight: .bold, design: .rounded))
        .foregroundStyle(model.color)
        .lineLimit(1)
    } else if model.mode == "icon" {
      Label(token)
        .labelStyle(.iconOnly)
        .font(.system(size: model.size))
        .scaleEffect(model.iconScale)
    } else {
      Label(token)
        .labelStyle(.titleAndIcon)
        .font(.system(size: model.size, weight: .bold, design: .rounded))
        .foregroundStyle(model.color)
        .lineLimit(1)
    }
  }
}

final class TmAppLabelView: ExpoView {
  let model = TmAppLabelModel()
  private var host: UIHostingController<TmAppLabel>?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    let controller = UIHostingController(rootView: TmAppLabel(model: model))
    controller.view.backgroundColor = .clear
    controller.view.isUserInteractionEnabled = false
    isUserInteractionEnabled = false
    clipsToBounds = true
    backgroundColor = .clear
    addSubview(controller.view)
    host = controller
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    host?.view.frame = bounds
  }
}
