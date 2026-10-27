//
//  ShieldConfigurationExtension.swift
//  ShieldConfiguration
//
//  Created by Robert Herber on 2024-10-25.
//

import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit
import os

func convertBase64StringToImage(imageBase64String: String?) -> UIImage? {
  if let imageBase64String = imageBase64String {
    let imageData = Data(base64Encoded: imageBase64String)
    let image = UIImage(data: imageData!)
    return image
  }

  return nil
}

func buildLabel(text: String?, with color: UIColor?, placeholders: [String: String?])
  -> ShieldConfiguration.Label? {
  if let text = text {
    let color = color ?? UIColor.label
    return .init(text: replacePlaceholders(text, with: placeholders), color: color)
  }

  return nil
}

func loadImageFromAppGroupDirectory(relativeFilePath: String) -> UIImage? {
  let appGroupDirectory = getAppGroupDirectory()

  let fileURL = appGroupDirectory!.appendingPathComponent(relativeFilePath)

  // Load the image data
  guard let imageData = try? Data(contentsOf: fileURL) else {
    print("Error: Could not load data from \(fileURL.path)")
    return nil
  }

  // Create and return the UIImage
  return UIImage(data: imageData)
}

func resolveIcon(dict: [String: Any]) -> UIImage? {
  let iconAppGroupRelativePath = dict["iconAppGroupRelativePath"] as? String
  let iconSystemName = dict["iconSystemName"] as? String

  var image: UIImage?

  if let iconSystemName = iconSystemName {
    image = UIImage(systemName: iconSystemName)
  }

  if let iconAppGroupRelativePath = iconAppGroupRelativePath {
    image = loadImageFromAppGroupDirectory(relativeFilePath: iconAppGroupRelativePath)
  }

  if let iconTint = getColor(color: dict["iconTint"] as? [String: Double]) {
    image = image?.withTintColor(iconTint, renderingMode: .alwaysOriginal)
  }

  return image
}

func buildShield(placeholders: [String: String?], config: [String: Any]?)
  -> ShieldConfiguration {

  if let appGroup = appGroup {
    logger.log("Calling getShieldConfiguration with appgroup: \(appGroup, privacy: .public)")
  } else {
    logger.log("Calling getShieldConfiguration without appgroup!")
  }

  CFPreferencesAppSynchronize(kCFPreferencesCurrentApplication)

  if let config = config {
    let backgroundColor = getColor(color: config["backgroundColor"] as? [String: Double])

    let title = config["title"] as? String
    let titleColor = getColor(color: config["titleColor"] as? [String: Double])

    let subtitle = config["subtitle"] as? String
    let subtitleColor = getColor(color: config["subtitleColor"] as? [String: Double])

    let primaryButtonLabel = config["primaryButtonLabel"] as? String
    let primaryButtonLabelColor = getColor(
      color: config["primaryButtonLabelColor"] as? [String: Double])
    let primaryButtonBackgroundColor = getColor(
      color: config["primaryButtonBackgroundColor"] as? [String: Double])

    let secondaryButtonLabel = config["secondaryButtonLabel"] as? String
    let secondaryButtonLabelColor = getColor(
      color: config["secondaryButtonLabelColor"] as? [String: Double]
    )

    let shield = ShieldConfiguration(
      backgroundBlurStyle: config["backgroundBlurStyle"] != nil
        ? (config["backgroundBlurStyle"] as? Int).flatMap(UIBlurEffect.Style.init) : nil,
      backgroundColor: backgroundColor,
      icon: resolveIcon(dict: config),
      title: buildLabel(text: title, with: titleColor, placeholders: placeholders),
      subtitle: buildLabel(text: subtitle, with: subtitleColor, placeholders: placeholders),
      primaryButtonLabel: buildLabel(
        text: primaryButtonLabel, with: primaryButtonLabelColor, placeholders: placeholders),
      primaryButtonBackgroundColor: primaryButtonBackgroundColor,
      secondaryButtonLabel: buildLabel(
        text: secondaryButtonLabel, with: secondaryButtonLabelColor, placeholders: placeholders)
    )
    logger.log("shield initialized")

    return shield
  }

  return ShieldConfiguration()
}

// MARK: - Till Morning

let TM_COOLOFF_PREFIX = "tm_cooloff::"
let TM_NAME_PREFIX = "tm_name::"

func tmTokenKey<T: Encodable>(_ token: T?) -> String? {
  guard let token = token, let data = try? JSONEncoder().encode(token) else { return nil }
  return data.base64EncodedString()
}

func tmRGB(_ hex: Int) -> UIColor {
  UIColor(
    red: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
    blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}

/// Remembers the app's name for the action extension, and returns the cool-off shield
/// ("Taking a break from …") when this app is still cooling off.
func tmCoolOffShieldIfNeeded(application: Application, config: [String: Any]?)
  -> ShieldConfiguration?
{
  guard let key = tmTokenKey(application.token) else { return nil }
  let name = application.localizedDisplayName ?? "this app"
  userDefaults?.set(name, forKey: TM_NAME_PREFIX + key)

  guard let until = userDefaults?.object(forKey: TM_COOLOFF_PREFIX + key) as? Double,
    until > Date().timeIntervalSince1970
  else { return nil }

  let formatter = DateFormatter()
  formatter.locale = Locale(identifier: "en_GB")
  formatter.dateFormat = "HH:mm"
  let time = formatter.string(from: Date(timeIntervalSince1970: until))

  return ShieldConfiguration(
    backgroundBlurStyle: nil,
    backgroundColor: tmRGB(0x101236),
    icon: resolveIcon(dict: config ?? [:]),
    title: .init(text: "Taking a break from \(name)", color: tmRGB(0xF3F2FF)),
    subtitle: .init(
      text: "You chose to leave it a moment ago.\nIt unlocks at \(time).", color: tmRGB(0xB4B6E4)),
    primaryButtonLabel: .init(text: "Close \(name)", color: .white),
    primaryButtonBackgroundColor: tmRGB(0x4361FF),
    secondaryButtonLabel: nil
  )
}

/// Per-app shield lines the app writes for each protected app (habit line, its budget, backup dinner).
/// tm_sub::<key> replaces the normal subtitle; tm_nightsub::<key> is added under the night-lock line.
func tmPersonalised(_ config: [String: Any]?, application: Application) -> [String: Any]? {
  var cfg = config ?? [:]
  if let key = tmTokenKey(application.token),
    let sub = userDefaults?.string(forKey: "tm_sub::" + key), !sub.isEmpty
  {
    cfg["subtitle"] = sub
  }
  // Notifications off: "I still want it" can't send its "Tap to start your pause", so say what to do.
  if config != nil, userDefaults?.object(forKey: "tm_notify_ok") as? Bool == false {
    let base = (cfg["subtitle"] as? String) ?? "Is this a planned purchase?"
    cfg["subtitle"] = base + "\nStill want it? Tap below, then open Till Morning for your pause."
  }
  return config == nil && cfg.isEmpty ? nil : cfg
}

func tmNightExtra(application: Application) -> String? {
  guard let key = tmTokenKey(application.token),
    let extra = userDefaults?.string(forKey: "tm_nightsub::" + key), !extra.isEmpty
  else { return nil }
  return extra
}

func tmNightSubtitle(to: Int, extra: String?) -> String {
  let line = "Night lock is on until \(to < 10 ? "0" : "")\(to):00"
  guard let extra = extra else { return line }
  return line + "\n" + extra
}

/// Night lock window (default 23:00–07:00), written by the app as tm_nl_on/from/to.
func tmNightActive(_ date: Date = Date()) -> Bool {
  guard userDefaults?.object(forKey: "tm_nl_on") as? Bool ?? true else { return false }
  let from = userDefaults?.object(forKey: "tm_nl_from") as? Int ?? 23
  let to = userDefaults?.object(forKey: "tm_nl_to") as? Int ?? 7
  let h = Calendar.current.component(.hour, from: date)
  return from > to ? (h >= from || h < to) : (h >= from && h < to)
}

/// The night-lock shield ("It's late. … can wait till morning.") and the late shield
/// (22:00 to midnight when night lock isn’t on: "It's 23:10. … will still be there at 8.").
func tmNightOrLateShield(application: Application, config: [String: Any]?) -> ShieldConfiguration? {
  let name = application.localizedDisplayName ?? "this app"
  let now = Date()
  let formatter = DateFormatter()
  formatter.locale = Locale(identifier: "en_GB")
  formatter.dateFormat = "HH:mm"

  if tmNightActive(now) {
    let to = userDefaults?.object(forKey: "tm_nl_to") as? Int ?? 7
    return ShieldConfiguration(
      backgroundBlurStyle: nil,
      backgroundColor: tmRGB(0x0D0F33),
      icon: UIImage(systemName: "moon.zzz.fill")?.withTintColor(tmRGB(0x8EA2FF), renderingMode: .alwaysOriginal),
      title: .init(text: "It’s late. \(name) can wait till morning.", color: tmRGB(0xF3F2FF)),
      subtitle: .init(
        text: tmNightSubtitle(to: to, extra: tmNightExtra(application: application)),
        color: tmRGB(0x9EA3D9)),
      primaryButtonLabel: .init(text: "Close \(name)", color: .white),
      primaryButtonBackgroundColor: tmRGB(0x4361FF),
      secondaryButtonLabel: .init(text: "Park it till morning", color: tmRGB(0xC4B5FD))
    )
  }

  let h = Calendar.current.component(.hour, from: now)
  guard h >= 22 else { return nil }  // the risky hour, as in the app (rules.ts NIGHT_FROM)
  var subtitle = (config?["subtitle"] as? String) ?? "Is this a planned purchase?"
  if let stats = userDefaults?.string(forKey: "tm_leftstats::\(name)") {
    let parts = stats.split(separator: "|").compactMap { Int($0) }
    if parts.count == 2, parts[1] >= 2, parts[0] >= 1 {
      subtitle = "You left it \(parts[0]) of the last \(parts[1]) times."
    }
  }
  return ShieldConfiguration(
    backgroundBlurStyle: nil,
    backgroundColor: tmRGB(0x101236),
    icon: resolveIcon(dict: config ?? [:]),
    title: .init(text: "It’s \(formatter.string(from: now)). \(name) will still be there at 8.", color: tmRGB(0xF3F2FF)),
    subtitle: .init(text: subtitle, color: tmRGB(0xB4B6E4)),
    primaryButtonLabel: .init(text: "Close \(name)", color: .white),
    primaryButtonBackgroundColor: tmRGB(0x4361FF),
    secondaryButtonLabel: .init(text: "I still want it", color: tmRGB(0x93A5FF))
  )
}

// Override the functions below to customize the shields used in various situations.
// The system provides a default appearance for any methods that your subclass doesn't override.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  override func configuration(shielding application: Application) -> ShieldConfiguration {
    // Customize the shield as needed for applications.

    let baseConfig = getActivitySelectionPrefixedConfigFromUserDefaults(
      keyPrefix: SHIELD_CONFIGURATION_FOR_SELECTION_PREFIX,
      fallbackKey: FALLBACK_SHIELD_CONFIGURATION_KEY,
      applicationToken: application.token
    )
    let config = tmPersonalised(baseConfig, application: application)

    if let coolOff = tmCoolOffShieldIfNeeded(application: application, config: config) {
      return coolOff
    }
    if let night = tmNightOrLateShield(application: application, config: config) {
      return night
    }

    let placeholders: [String: String?] = [
      "applicationOrDomainDisplayName": application.localizedDisplayName,
      "token": "\(application.token!.hashValue)",
      "tokenType": "application",
      "familyActivitySelectionId": getPossibleFamilyActivitySelectionIds(
        applicationToken: application.token
      ).first?.id
    ]

    return buildShield(
      placeholders: placeholders,
      config: config
    )
  }

  override func configuration(shielding application: Application, in category: ActivityCategory)
    -> ShieldConfiguration {

    logger.log("shielding application category")

    let categoryConfig = getActivitySelectionPrefixedConfigFromUserDefaults(
      keyPrefix: SHIELD_CONFIGURATION_FOR_SELECTION_PREFIX,
      fallbackKey: FALLBACK_SHIELD_CONFIGURATION_KEY,
      applicationToken: application.token,
      categoryToken: category.token
    )
    let config = tmPersonalised(categoryConfig, application: application)

    if let coolOff = tmCoolOffShieldIfNeeded(application: application, config: config) {
      return coolOff
    }
    if let night = tmNightOrLateShield(application: application, config: config) {
      return night
    }

    let placeholders = [
      "applicationOrDomainDisplayName": application.localizedDisplayName,
      "token": "\(category.token!.hashValue)",
      "tokenType": "application_category",
      "familyActivitySelectionId": getPossibleFamilyActivitySelectionIds(
        applicationToken: application.token,
        categoryToken: category.token
      ).first?.id
    ]

    return buildShield(
      placeholders: placeholders,
      config: config
    )
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    logger.log("shielding web domain")

    let config = getActivitySelectionPrefixedConfigFromUserDefaults(
      keyPrefix: SHIELD_CONFIGURATION_FOR_SELECTION_PREFIX,
      fallbackKey: FALLBACK_SHIELD_CONFIGURATION_KEY,
      webDomainToken: webDomain.token
    )

    let placeholders = [
      "applicationOrDomainDisplayName": webDomain.domain,
      "token": "\(webDomain.token!.hashValue)",
      "tokenType": "web_domain",
      "familyActivitySelectionId": getPossibleFamilyActivitySelectionIds(
        webDomainToken: webDomain.token
      ).first?.id
    ]

    return buildShield(
      placeholders: placeholders,
      config: config
    )
  }

  override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory)
    -> ShieldConfiguration {

    logger.log("shielding web domain category")

    let config = getActivitySelectionPrefixedConfigFromUserDefaults(
      keyPrefix: SHIELD_CONFIGURATION_FOR_SELECTION_PREFIX,
      fallbackKey: FALLBACK_SHIELD_CONFIGURATION_KEY,
      webDomainToken: webDomain.token,
      categoryToken: category.token
    )

    let placeholders = [
      "applicationOrDomainDisplayName": webDomain.domain,
      "token": "\(category.token!.hashValue)",
      "tokenType": "web_domain_category",
      "familyActivitySelectionId": getPossibleFamilyActivitySelectionIds(
        webDomainToken: webDomain.token,
        categoryToken: category.token
      ).first?.id
    ]

    return buildShield(
      placeholders: placeholders,
      config: config
    )
  }
}
