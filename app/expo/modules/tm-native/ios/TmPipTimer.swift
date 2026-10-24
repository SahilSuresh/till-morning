import AVFoundation
import AVKit
import CoreMedia
import UIKit

/// A floating Shopping Pass countdown that stays on screen over other apps (Picture in Picture).
/// iPhones without a Dynamic Island can't show a Live Activity over an app, so this is the way to
/// keep an eye on the pass while shopping. Frames are drawn on the phone, nothing is streamed.
final class TmPipTimer: NSObject, AVPictureInPictureControllerDelegate, AVPictureInPictureSampleBufferPlaybackDelegate {
  static let shared = TmPipTimer()

  private let displayLayer = AVSampleBufferDisplayLayer()
  private var controller: AVPictureInPictureController?
  private var hostView: UIView?
  private var ticker: Timer?
  private var startedAt = Date()
  private var endsAt = Date()
  private var title = "Shopping pass"
  private var endedShownAt: Date?
  private let size = CGSize(width: 480, height: 270)

  static var isSupported: Bool { AVPictureInPictureController.isPictureInPictureSupported() }

  func start(title: String, startedAt: Double, endsAt: Double) {
    DispatchQueue.main.async {
      self.title = title
      self.startedAt = Date(timeIntervalSince1970: startedAt / 1000)
      self.endsAt = Date(timeIntervalSince1970: endsAt / 1000)
      self.endedShownAt = nil
      guard TmPipTimer.isSupported else { return }
      try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback, options: [.mixWithOthers])
      try? AVAudioSession.sharedInstance().setActive(true)
      self.attachLayer()
      self.render()
      self.ticker?.invalidate()
      self.ticker = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in self?.render() }
      if self.controller == nil {
        let source = AVPictureInPictureController.ContentSource(sampleBufferDisplayLayer: self.displayLayer, playbackDelegate: self)
        let c = AVPictureInPictureController(contentSource: source)
        c.delegate = self
        c.canStartPictureInPictureAutomaticallyFromInline = true
        c.requiresLinearPlayback = true
        self.controller = c
      }
      // Give the layer a frame before asking iOS to float it.
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
        guard let c = self?.controller, !c.isPictureInPictureActive else { return }
        if c.isPictureInPicturePossible { c.startPictureInPicture() }
      }
    }
  }

  func stop() {
    DispatchQueue.main.async {
      self.ticker?.invalidate()
      self.ticker = nil
      self.controller?.stopPictureInPicture()
      self.displayLayer.sampleBufferRenderer.flush(removingDisplayedImage: true, completionHandler: nil)
      self.hostView?.removeFromSuperview()
      self.hostView = nil
      try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
    }
  }

  // MARK: - Layer and frames

  private func attachLayer() {
    guard hostView == nil else { return }
    let window = UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.keyWindow }
      .first
    guard let window = window else { return }
    // PiP needs the layer in the view tree; keep it tiny and almost invisible.
    let v = UIView(frame: CGRect(x: 0, y: 0, width: 4, height: 2))
    v.alpha = 0.01
    v.isUserInteractionEnabled = false
    displayLayer.frame = CGRect(x: 0, y: 0, width: 4, height: 2)
    displayLayer.videoGravity = .resizeAspect
    var timebase: CMTimebase?
    CMTimebaseCreateWithSourceClock(allocator: kCFAllocatorDefault, sourceClock: CMClockGetHostTimeClock(), timebaseOut: &timebase)
    if let tb = timebase {
      CMTimebaseSetTime(tb, time: CMClockGetTime(CMClockGetHostTimeClock()))
      CMTimebaseSetRate(tb, rate: 1)
      displayLayer.controlTimebase = tb
    }
    v.layer.addSublayer(displayLayer)
    window.addSubview(v)
    hostView = v
  }

  private func text(_ s: String) -> String { s }

  private func render() {
    let now = Date()
    let left = max(0, endsAt.timeIntervalSince(now))
    if left <= 0 {
      if endedShownAt == nil { endedShownAt = now }
      if let shown = endedShownAt, now.timeIntervalSince(shown) > 6 {
        stop()
        return
      }
    }
    guard let buffer = drawFrame(left: left) else { return }
    enqueue(buffer)
  }

  private func drawFrame(left: TimeInterval) -> CVPixelBuffer? {
    let w = Int(size.width), h = Int(size.height)
    var pb: CVPixelBuffer?
    let attrs: [CFString: Any] = [
      kCVPixelBufferCGImageCompatibilityKey: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey: true,
      kCVPixelBufferIOSurfacePropertiesKey: [:] as CFDictionary,
    ]
    CVPixelBufferCreate(kCFAllocatorDefault, w, h, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &pb)
    guard let buffer = pb else { return nil }
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    guard
      let ctx = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer), width: w, height: h, bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer), space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)
    else { return nil }

    // UIKit drawing (origin top-left).
    ctx.translateBy(x: 0, y: CGFloat(h))
    ctx.scaleBy(x: 1, y: -1)
    UIGraphicsPushContext(ctx)
    defer { UIGraphicsPopContext() }

    let rect = CGRect(origin: .zero, size: size)
    let ended = left <= 0
    // Background: the ticket's violet gradient, or calm navy when time's up.
    let colors = ended
      ? [UIColor(red: 0.08, green: 0.09, blue: 0.25, alpha: 1).cgColor, UIColor(red: 0.05, green: 0.06, blue: 0.18, alpha: 1).cgColor]
      : [UIColor(red: 0.49, green: 0.25, blue: 0.95, alpha: 1).cgColor, UIColor(red: 0.71, green: 0.33, blue: 0.94, alpha: 1).cgColor]
    if let g = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: [0, 1]) {
      ctx.drawLinearGradient(g, start: .zero, end: CGPoint(x: rect.width, y: rect.height), options: [])
    }

    let white = UIColor.white
    func draw(_ s: String, font: UIFont, color: UIColor, y: CGFloat) {
      let p = NSMutableParagraphStyle()
      p.alignment = .center
      let attr: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: color, .paragraphStyle: p]
      let str = NSAttributedString(string: s, attributes: attr)
      let bounds = str.boundingRect(with: CGSize(width: rect.width - 40, height: 400), options: .usesLineFragmentOrigin, context: nil)
      str.draw(in: CGRect(x: 20, y: y, width: rect.width - 40, height: bounds.height))
    }
    let rounded = { (size: CGFloat, weight: UIFont.Weight) -> UIFont in
      let base = UIFont.systemFont(ofSize: size, weight: weight)
      if let d = base.fontDescriptor.withDesign(.rounded) { return UIFont(descriptor: d, size: size) }
      return base
    }

    if ended {
      draw("Time’s up", font: rounded(64, .bold), color: white, y: 70)
      draw("Your shop app is locked again", font: rounded(26, .semibold), color: white.withAlphaComponent(0.8), y: 160)
    } else {
      let secs = Int(left.rounded(.up))
      let clock = secs >= 3600
        ? String(format: "%d:%02d:%02d", secs / 3600, (secs % 3600) / 60, secs % 60)
        : String(format: "%d:%02d", secs / 60, secs % 60)
      draw("🎟  " + title, font: rounded(26, .bold), color: white.withAlphaComponent(0.9), y: 34)
      draw(clock, font: UIFont.monospacedDigitSystemFont(ofSize: 104, weight: .bold), color: white, y: 74)
      // Progress bar.
      let total = max(1, endsAt.timeIntervalSince(startedAt))
      let frac = CGFloat(max(0, min(1, left / total)))
      let track = CGRect(x: 40, y: 222, width: rect.width - 80, height: 12)
      UIColor.white.withAlphaComponent(0.28).setFill()
      UIBezierPath(roundedRect: track, cornerRadius: 6).fill()
      UIColor.white.setFill()
      UIBezierPath(roundedRect: CGRect(x: track.minX, y: track.minY, width: track.width * frac, height: track.height), cornerRadius: 6).fill()
    }
    return buffer
  }

  private func enqueue(_ buffer: CVPixelBuffer) {
    var format: CMVideoFormatDescription?
    CMVideoFormatDescriptionCreateForImageBuffer(allocator: kCFAllocatorDefault, imageBuffer: buffer, formatDescriptionOut: &format)
    guard let fmt = format else { return }
    var timing = CMSampleTimingInfo(
      duration: CMTime(value: 1, timescale: 2),
      presentationTimeStamp: CMClockGetTime(CMClockGetHostTimeClock()),
      decodeTimeStamp: .invalid)
    var sample: CMSampleBuffer?
    CMSampleBufferCreateReadyWithImageBuffer(
      allocator: kCFAllocatorDefault, imageBuffer: buffer, formatDescription: fmt, sampleTiming: &timing, sampleBufferOut: &sample)
    guard let s = sample else { return }
    if let attachments = CMSampleBufferGetSampleAttachmentsArray(s, createIfNecessary: true), CFArrayGetCount(attachments) > 0 {
      let dict = unsafeBitCast(CFArrayGetValueAtIndex(attachments, 0), to: CFMutableDictionary.self)
      CFDictionarySetValue(
        dict, Unmanaged.passUnretained(kCMSampleAttachmentKey_DisplayImmediately).toOpaque(),
        Unmanaged.passUnretained(kCFBooleanTrue).toOpaque())
    }
    let renderer = displayLayer.sampleBufferRenderer
    if renderer.status == .failed { renderer.flush() }
    renderer.enqueue(s)
  }

  // MARK: - AVPictureInPictureSampleBufferPlaybackDelegate (a live countdown: always "playing")

  func pictureInPictureController(_ pictureInPictureController: AVPictureInPictureController, setPlaying playing: Bool) {}

  func pictureInPictureControllerTimeRangeForPlayback(_ pictureInPictureController: AVPictureInPictureController) -> CMTimeRange {
    CMTimeRange(start: .negativeInfinity, duration: .positiveInfinity)
  }

  func pictureInPictureControllerIsPlaybackPaused(_ pictureInPictureController: AVPictureInPictureController) -> Bool { false }

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController, didTransitionToRenderSize newRenderSize: CMVideoDimensions
  ) {}

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController, skipByInterval skipInterval: CMTime,
    completion completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }

  // MARK: - AVPictureInPictureControllerDelegate

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
  ) {
    completionHandler(true)
  }
}
