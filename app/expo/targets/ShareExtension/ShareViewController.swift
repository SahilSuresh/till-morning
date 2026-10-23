import SwiftUI
import UIKit
import UniformTypeIdentifiers

// MARK: - Colours

private func tmColor(_ hex: UInt32, _ a: Double = 1) -> Color {
  Color(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255, opacity: a)
}
private let cNight = tmColor(0x0D0F2E)
private let cSheet = tmColor(0x15183F)
private let cCard = tmColor(0x1C2057)
private let cLine = tmColor(0x2E3374)
private let cText = tmColor(0xF3F2FF)
private let cText2 = tmColor(0xB4B6E4)
private let cText3 = tmColor(0x8A8EC6)
private let cBlue = tmColor(0x4361FF)
private let cBlueLight = tmColor(0x93A5FF)
private let cMint = tmColor(0x6EF0BF)
private let cLilac = tmColor(0xC4B5FD)

// MARK: - Model

final class TmShareModel: ObservableObject {
  @Published var loading = true
  @Published var image: UIImage?
  @Published var host: String?
  @Published var what = ""
  @Published var total: Double?
  @Published var items: Int?
  @Published var band = "unsure"
  @Published var parked: TmParked?

  var effectiveBand: String { total != nil ? "exact" : band }
}

// MARK: - View

struct TmShareView: View {
  @ObservedObject var model: TmShareModel
  let close: () -> Void

  private let bands = ["unsure", "under20", "20to50", "50to100", "over100"]

  var body: some View {
    ZStack {
      cNight.ignoresSafeArea()
      if let parked = model.parked {
        done(parked)
      } else {
        form
      }
    }
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    HStack {
      Text("Park it till morning").font(.system(size: 22, weight: .bold, design: .rounded)).foregroundStyle(cText)
      Spacer()
      Button("Cancel", action: close).font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(cBlueLight)
    }
  }

  private var form: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 14) {
        header
        if let host = model.host {
          Text("Shared from \(host): the link, title and picture only")
            .font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(cText3)
        } else {
          Text("Your basket stays in the shop. Till Morning remembers it, and morning-you decides.")
            .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(cText2)
        }

        if model.loading {
          HStack(spacing: 10) {
            ProgressView().tint(cBlueLight)
            Text("Reading your screenshot…").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(cText)
          }
          .padding(14).frame(maxWidth: .infinity, alignment: .leading)
          .background(RoundedRectangle(cornerRadius: 18).fill(cCard))
        } else if model.image != nil || model.total != nil {
          HStack(spacing: 12) {
            if let img = model.image {
              Image(uiImage: img).resizable().scaledToFill().frame(width: 52, height: 88).clipShape(RoundedRectangle(cornerRadius: 10))
            }
            VStack(alignment: .leading, spacing: 2) {
              if let t = model.total {
                Label("Basket read from your screenshot", systemImage: "checkmark.circle.fill")
                  .font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(cMint)
                Text(TmRules.money(t) + (model.items.map { "  ·  \($0) items" } ?? ""))
                  .font(.system(size: 24, weight: .bold, design: .rounded)).foregroundStyle(cText)
                Text("Read on this phone. The picture never leaves it.")
                  .font(.system(size: 12.5, weight: .medium, design: .rounded)).foregroundStyle(cText3)
              } else {
                Text("Couldn’t find a total").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(cText)
                Text("Pick a rough price below.").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(cText3)
              }
            }
            Spacer(minLength: 0)
          }
          .padding(12)
          .background(RoundedRectangle(cornerRadius: 18).fill(cCard))
          .overlay(RoundedRectangle(cornerRadius: 18).stroke(cLine, lineWidth: 1.5))
        }

        Text("WHAT IS IT? (OPTIONAL)").font(.system(size: 12, weight: .bold, design: .monospaced)).foregroundStyle(cText3)
        TextField("", text: $model.what, prompt: Text("Something from \(model.host ?? "a shop")").foregroundStyle(cText3))
          .font(.system(size: 17, weight: .semibold, design: .rounded)).foregroundStyle(cText)
          .padding(12).background(RoundedRectangle(cornerRadius: 16).fill(tmColor(0x12153A)))
          .overlay(RoundedRectangle(cornerRadius: 16).stroke(cLine, lineWidth: 1.5))

        if model.total == nil && !model.loading {
          Text("ROUGHLY HOW MUCH?").font(.system(size: 12, weight: .bold, design: .monospaced)).foregroundStyle(cText3)
          FlowChips(items: bands, selected: model.band) { model.band = $0 }
        }

        if !model.loading {
          let w = TmRules.wait(band: model.effectiveBand, price: model.total)
          VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
              Text("It waits").font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(cText2)
              Spacer()
              Text(TmRules.duration(w.ready.timeIntervalSinceNow)).font(.system(size: 26, weight: .bold, design: .rounded)).foregroundStyle(cBlueLight)
            }
            Text("Ready \(TmRules.readyLabel(w.ready))").font(.system(size: 13, weight: .semibold, design: .rounded))
              .foregroundStyle(cText2).frame(maxWidth: .infinity, alignment: .trailing)
            HStack(spacing: 6) {
              ForEach(w.why, id: \.self) { chip in
                Text(chip).font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(tmColor(0x14163A))
                  .padding(.horizontal, 9).padding(.vertical, 4).background(Capsule().fill(cLilac))
              }
            }
            if let t = model.total {
              Text("That’s about \(TmRules.workTime(t)) of your work.").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(cText2)
            }
          }
          .padding(16).background(RoundedRectangle(cornerRadius: 22).fill(cCard))
        }

        Button {
          let p = TmInbox.park(
            what: model.what.trimmingCharacters(in: .whitespacesAndNewlines),
            band: model.effectiveBand, price: model.total, items: model.items, source: "share", host: model.host)
          withAnimation(.easeOut(duration: 0.3)) { model.parked = p }
        } label: {
          Label("Park it", systemImage: "hourglass").font(.system(size: 18, weight: .bold, design: .rounded))
            .frame(maxWidth: .infinity).padding(.vertical, 16).foregroundStyle(.white)
            .background(Capsule().fill(cBlue))
            .shadow(color: tmColor(0x2A3BC0), radius: 0, x: 0, y: 4)
        }
        .disabled(model.loading)
        .opacity(model.loading ? 0.4 : 1)
        .padding(.top, 4)
      }
      .padding(22)
    }
  }

  private func done(_ p: TmParked) -> some View {
    let ready = Date(timeIntervalSince1970: p.readyAt / 1000)
    return VStack(spacing: 14) {
      Spacer()
      Image(systemName: "moon.zzz.fill").font(.system(size: 54)).foregroundStyle(cLilac)
      Text(Calendar.current.component(.hour, from: ready) == 8 ? "Parked. Sleep on it." : "Parked. Give it time.")
        .font(.system(size: 30, weight: .bold, design: .rounded)).foregroundStyle(cText).multilineTextAlignment(.center)
      Text("It’s in your waiting room till \(TmRules.readyLabel(ready)). Morning-you gets the final say. We’ll let you know when it’s ready.")
        .font(.system(size: 16, weight: .medium, design: .rounded)).foregroundStyle(cText2).multilineTextAlignment(.center)
      Text("+5 XP when you next open Till Morning").font(.system(size: 13, weight: .bold, design: .rounded))
        .foregroundStyle(tmColor(0x14163A)).padding(.horizontal, 10).padding(.vertical, 5).background(Capsule().fill(cMint))
      Spacer()
      Button(action: close) {
        Text("Done").font(.system(size: 18, weight: .bold, design: .rounded)).frame(maxWidth: .infinity).padding(.vertical, 16)
          .foregroundStyle(tmColor(0x2B2FB8)).background(Capsule().fill(.white))
      }
    }
    .padding(24)
  }
}

/// Wrapping row of price-band chips.
struct FlowChips: View {
  let items: [String]
  let selected: String
  let pick: (String) -> Void
  var body: some View {
    let rows = [Array(items.prefix(3)), Array(items.dropFirst(3))]
    VStack(alignment: .leading, spacing: 8) {
      ForEach(0..<rows.count, id: \.self) { r in
        HStack(spacing: 8) {
          ForEach(rows[r], id: \.self) { b in
            Button {
              pick(b)
            } label: {
              Text(TmRules.bandLabel[b] ?? b).font(.system(size: 14, weight: .bold, design: .rounded))
                .padding(.horizontal, 12).padding(.vertical, 8)
                .foregroundStyle(b == selected ? Color.white : cText)
                .background(Capsule().fill(b == selected ? cBlue : cCard))
                .overlay(Capsule().stroke(b == selected ? cBlue : cLine, lineWidth: 1.5))
            }
          }
        }
      }
    }
  }
}

// MARK: - Controller

class ShareViewController: UIViewController {
  private let model = TmShareModel()

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = UIColor(red: 13 / 255, green: 15 / 255, blue: 46 / 255, alpha: 1)
    let host = UIHostingController(rootView: TmShareView(model: model, close: { [weak self] in self?.finish() }))
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    host.view.backgroundColor = .clear
    view.addSubview(host.view)
    host.didMove(toParent: self)
    loadShared()
  }

  private func finish() {
    extensionContext?.completeRequest(returningItems: nil)
  }

  private func loadShared() {
    let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
    let title = items.first?.attributedContentText?.string ?? items.first?.attributedTitle?.string
    if let t = title?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty, !t.hasPrefix("http") {
      model.what = String(t.prefix(40))
    }
    let providers = items.flatMap { $0.attachments ?? [] }

    if let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }) {
      p.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] item, _ in
        var image: UIImage?
        if let url = item as? URL, let data = try? Data(contentsOf: url) { image = UIImage(data: data) }
        else if let data = item as? Data { image = UIImage(data: data) }
        else if let img = item as? UIImage { image = img }
        DispatchQueue.main.async { self?.read(image) }
      }
      return
    }
    if let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
      p.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
        let url = item as? URL
        DispatchQueue.main.async {
          self?.model.host = url?.host?.replacingOccurrences(of: "www.", with: "")
          self?.model.loading = false
        }
      }
      return
    }
    if let p = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) }) {
      p.loadItem(forTypeIdentifier: UTType.plainText.identifier, options: nil) { [weak self] item, _ in
        let text = (item as? String) ?? ""
        DispatchQueue.main.async {
          if let model = self?.model {
            if model.what.isEmpty { model.what = String(text.prefix(40)) }
            if let url = URL(string: text), let host = url.host { model.host = host.replacingOccurrences(of: "www.", with: "") }
            model.loading = false
          }
        }
      }
      return
    }
    model.loading = false
  }

  private func read(_ image: UIImage?) {
    model.image = image
    guard let image = image else {
      model.loading = false
      return
    }
    TmOCR.lines(in: image) { [weak self] lines in
      guard let self = self else { return }
      self.model.total = TmOCR.total(lines).map { ($0 * 100).rounded() / 100 }
      self.model.items = TmOCR.itemCount(lines)
      self.model.loading = false
    }
  }
}
