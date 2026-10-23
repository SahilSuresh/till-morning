//
//  ShieldActionExtension.swift
//  ShieldAction
//
//  Created by Robert Herber on 2024-10-25.
//

import FamilyControls
import ManagedSettings
import UIKit

func handleShieldAction(
  configForSelectedAction: [String: Any],
  placeholders: [String: String?],
  applicationToken: ApplicationToken?,
  webdomainToken: WebDomainToken?,
  categoryToken: ActivityCategoryToken?
) -> ShieldActionResponse {
  logger.log("handleAction")
  if let actions = configForSelectedAction["actions"] as? [[String: Any]] {
    for action in actions {
      executeGenericAction(
        action: action,
        placeholders: placeholders,
        triggeredBy: "shieldAction",
        applicationToken: applicationToken,
        webdomainToken: webdomainToken,
        categoryToken: categoryToken
      )
    }
  }

  if let type = configForSelectedAction["type"] as? String {
    logger.log("type: \(type, privacy: .public)")
    if type == "disableBlockAllMode" {
      disableBlockAllMode(triggeredBy: "shieldAction")
    }

    let onlyFamilySelectionIdsContainingMonitoredActivityNames =
      configForSelectedAction["onlyFamilySelectionIdsContainingMonitoredActivityNames"] as? Bool
      ?? true

    let sortByGranularity = true

    if type == "unblockPossibleFamilyActivitySelection" {
      if let possibleFamilyActivitySelectionId = getPossibleFamilyActivitySelectionIds(
        applicationToken: applicationToken,
        webDomainToken: webdomainToken,
        categoryToken: categoryToken,
        onlyFamilySelectionIdsContainingMonitoredActivityNames:
          onlyFamilySelectionIdsContainingMonitoredActivityNames,
        sortByGranularity: sortByGranularity
      ).first?.id {
        if let selection = getFamilyActivitySelectionById(id: possibleFamilyActivitySelectionId) {
          unblockSelection(removeSelection: selection, triggeredBy: "shieldAction")
        }
      }
    }

    if type == "unblockAllPossibleFamilyActivitySelections" {
      let possibleFamilyActivitySelections = getPossibleFamilyActivitySelectionIds(
        applicationToken: applicationToken,
        webDomainToken: webdomainToken,
        categoryToken: categoryToken,
        onlyFamilySelectionIdsContainingMonitoredActivityNames:
          onlyFamilySelectionIdsContainingMonitoredActivityNames,
        sortByGranularity: sortByGranularity
      )

      for selection in possibleFamilyActivitySelections {
        unblockSelection(
          removeSelection: selection.selection,
          triggeredBy: "shieldAction"
        )
      }
    }

    if type == "whitelistPossibleFamilyActivitySelection" {
      if let possibleFamilyActivitySelectionId = getPossibleFamilyActivitySelectionIds(
        applicationToken: applicationToken,
        webDomainToken: webdomainToken,
        categoryToken: categoryToken,
        onlyFamilySelectionIdsContainingMonitoredActivityNames:
          onlyFamilySelectionIdsContainingMonitoredActivityNames,
        sortByGranularity: sortByGranularity
      ).first?.id {
        if let selection = getFamilyActivitySelectionById(id: possibleFamilyActivitySelectionId) {
          addSelectionToWhitelistAndUpdateBlock(
            whitelistSelection: selection,
            triggeredBy: "shieldAction"
          )
        }
      }
    }

    if type == "whitelistAllPossibleFamilyActivitySelections" {
      let possibleFamilyActivitySelections = getPossibleFamilyActivitySelectionIds(
        applicationToken: applicationToken,
        webDomainToken: webdomainToken,
        categoryToken: categoryToken,
        onlyFamilySelectionIdsContainingMonitoredActivityNames:
          onlyFamilySelectionIdsContainingMonitoredActivityNames,
        sortByGranularity: sortByGranularity
      )

      for selection in possibleFamilyActivitySelections {
        addSelectionToWhitelistAndUpdateBlock(
          whitelistSelection: selection.selection,
          triggeredBy: "shieldAction"
        )
      }
    }

    if type == "resetBlocks" {
      resetBlocks(triggeredBy: "shieldAction")
    }

    let url = configForSelectedAction["url"] as? String

    if type == "openUrl" {
      openUrl(urlString: url ?? "device-activity://")
    }

    if type == "openUrlWithDispatch" {
      DispatchQueue.main.async(execute: {
        openUrl(urlString: url ?? "device-activity://")
      })
    }

    if type == "sendNotification" {
      if let payload = configForSelectedAction["payload"] as? [String: Any] {
        sendNotification(contents: payload, placeholders: [:])
      }
    }

    if type == "addCurrentToWhitelist" {
      var selection = getCurrentWhitelist()

      if let applicationToken = applicationToken {
        selection.applicationTokens.insert(applicationToken)
      }

      if let webdomainToken = webdomainToken {
        selection.webDomainTokens.insert(webdomainToken)
      }

      if let categoryToken = categoryToken {
        selection.categoryTokens.insert(categoryToken)
      }

      saveCurrentWhitelist(whitelist: selection)
      updateBlock(triggeredBy: "shieldAction")
    }
  }

  CFPreferencesAppSynchronize(kCFPreferencesCurrentApplication)

  if let behavior = configForSelectedAction["behavior"] as? String {
    if behavior == "defer" {
      return .defer
    }
  }

  return .close
}

// MARK: - Till Morning
// The shield-action extension usually can't read an app's name, and Swift hash values
// change between processes, so apps are keyed by their encoded token. The
// ShieldConfiguration extension (which can see the name) records it under TM_NAME_PREFIX.

let TM_COOLOFF_PREFIX = "tm_cooloff::"
let TM_NAME_PREFIX = "tm_name::"
let TM_LAST_SHIELDED_SELECTION_ID = "tm_last_shielded"
let TM_SHIELD_LOG_KEY = "tm_shield_log"

func tmTokenKey<T: Encodable>(_ token: T?) -> String? {
  guard let token = token, let data = try? JSONEncoder().encode(token) else { return nil }
  return data.base64EncodedString()
}

func tmAppendShieldLog(action: String, name: String) {
  var log: [[String: Any]] = []
  if let raw = userDefaults?.string(forKey: TM_SHIELD_LOG_KEY),
    let data = raw.data(using: .utf8),
    let parsed = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
  {
    log = parsed
  }
  log.append(["a": action, "n": name, "t": Date().timeIntervalSince1970 * 1000])
  if log.count > 200 { log = Array(log.suffix(200)) }
  if let data = try? JSONSerialization.data(withJSONObject: log),
    let str = String(data: data, encoding: .utf8)
  {
    userDefaults?.set(str, forKey: TM_SHIELD_LOG_KEY)
  }
}

/// Returns true when Till Morning fully handled the tap (the generic library actions are skipped).
func tmHandleShieldTap(
  action: ShieldAction,
  applicationToken: ApplicationToken?,
  completionHandler: @escaping (ShieldActionResponse) -> Void
) -> Bool {
  let key = tmTokenKey(applicationToken)
  let name =
    key.flatMap { userDefaults?.string(forKey: TM_NAME_PREFIX + $0) }
    ?? applicationToken.flatMap { Application(token: $0).localizedDisplayName }
    ?? "this app"
  let now = Date().timeIntervalSince1970

  if let key = key,
    let until = userDefaults?.object(forKey: TM_COOLOFF_PREFIX + key) as? Double, until > now
  {
    // Cool-off shields only offer Close, and closing again earns nothing.
    completionHandler(.close)
    return true
  }

  if let token = applicationToken {
    var selection = FamilyActivitySelection()
    selection.applicationTokens.insert(token)
    setFamilyActivitySelectionById(id: TM_LAST_SHIELDED_SELECTION_ID, activitySelection: selection)
  }
  if let key = key { userDefaults?.set(key, forKey: "tm_last_shielded_key") }
  userDefaults?.set(name, forKey: "tm_last_shielded_name")
  userDefaults?.set(now * 1000, forKey: "tm_last_shielded_at")

  if action == .primaryButtonPressed {
    tmAppendShieldLog(action: "close", name: name)
    let minutes = userDefaults?.object(forKey: "tm_cooloff_minutes") as? Int ?? 10
    if minutes > 0, let key = key {
      userDefaults?.set(now + Double(minutes * 60), forKey: TM_COOLOFF_PREFIX + key)
    }
    CFPreferencesAppSynchronize(kCFPreferencesCurrentApplication)
    completionHandler(.close)
    return true
  }

  // "I still want to shop": the shield can't open the app on most iOS versions,
  // so a notification takes them straight into the pause (or, at night, to park it).
  tmAppendShieldLog(action: "want", name: name)
  let nlOn = userDefaults?.object(forKey: "tm_nl_on") as? Bool ?? true
  let nlFrom = userDefaults?.object(forKey: "tm_nl_from") as? Int ?? 23
  let nlTo = userDefaults?.object(forKey: "tm_nl_to") as? Int ?? 7
  let hour = Calendar.current.component(.hour, from: Date())
  let night = nlOn && (nlFrom > nlTo ? (hour >= nlFrom || hour < nlTo) : (hour >= nlFrom && hour < nlTo))
  sendNotification(
    contents: [
      "title": night ? "Park it till morning" : "Tap to start your pause",
      "body": night ? "Tap to park it, or say why it’s urgent." : "Take a breath before \(name).",
      "sound": "default",
      "interruptionLevel": "timeSensitive",
      "identifier": "tm_pause_request",
      "userInfo": ["url": "tillmorning://pause", "app": name],
    ],
    placeholders: [:]
  )
  openUrl(urlString: "tillmorning://pause")
  CFPreferencesAppSynchronize(kCFPreferencesCurrentApplication)
  completionHandler(.close)
  return true
}

func handleAction(
  action: ShieldAction,
  completionHandler: @escaping (ShieldActionResponse) -> Void,
  applicationToken: ApplicationToken?,
  webdomainToken: WebDomainToken?,
  categoryToken: ActivityCategoryToken?
) {
  CFPreferencesAppSynchronize(kCFPreferencesCurrentApplication)

  if applicationToken != nil,
    tmHandleShieldTap(
      action: action, applicationToken: applicationToken, completionHandler: completionHandler)
  {
    return
  }

  if let shieldActionConfig = getActivitySelectionPrefixedConfigFromUserDefaults(
    keyPrefix: SHIELD_ACTIONS_FOR_SELECTION_PREFIX,
    fallbackKey: SHIELD_ACTIONS_KEY,
    applicationToken: applicationToken,
    webDomainToken: webdomainToken,
    categoryToken: categoryToken
  ) {
    let actionButton = action == .primaryButtonPressed ? "primary" : "secondary"
    let familyActivitySelectionId = getPossibleFamilyActivitySelectionIds(
      applicationToken: applicationToken,
      webDomainToken: webdomainToken,
      categoryToken: categoryToken,
      onlyFamilySelectionIdsContainingMonitoredActivityNames: true,
      sortByGranularity: true
    ).first
    if let configForSelectedAction = shieldActionConfig[actionButton] as? [String: Any] {
      let placeholders: [String: String?] = [
        "action": actionButton,
        "applicationName": applicationToken != nil
          ? Application(token: applicationToken!).localizedDisplayName : nil,
        "webDomain": webdomainToken != nil
          ? WebDomain(
            token: webdomainToken!
          ).domain : nil,
        "familyActivitySelectionId": familyActivitySelectionId?.id
      ]

      let response = handleShieldAction(
        configForSelectedAction: configForSelectedAction,
        placeholders: placeholders,
        applicationToken: applicationToken,
        webdomainToken: webdomainToken,
        categoryToken: categoryToken
      )
      if let delay = configForSelectedAction["delay"] as? Double {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
          completionHandler(response)
        }
      } else {
        completionHandler(response)
      }
    } else {
      completionHandler(.close)
    }
  } else {
    completionHandler(.close)
  }
}

// Override the functions below to customize the shield actions used in various situations.
// The system provides a default response for any functions that your subclass doesn't override.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class ShieldActionExtension: ShieldActionDelegate {
  override func handle(
    action: ShieldAction, for application: ApplicationToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    logger.log("handle application")

    handleAction(
      action: action,
      completionHandler: completionHandler,
      applicationToken: application,
      webdomainToken: nil,
      categoryToken: nil
    )
  }

  override func handle(
    action: ShieldAction, for webDomain: WebDomainToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    logger.log("handle domain")

    handleAction(
      action: action,
      completionHandler: completionHandler,
      applicationToken: nil,
      webdomainToken: webDomain,
      categoryToken: nil
    )
  }

  override func handle(
    action: ShieldAction, for category: ActivityCategoryToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    logger.log("handle category")

    handleAction(
      action: action,
      completionHandler: completionHandler,
      applicationToken: nil,
      webdomainToken: nil,
      categoryToken: category
    )
  }
}
