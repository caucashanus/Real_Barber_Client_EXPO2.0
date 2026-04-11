import ActivityKit
import Foundation
import React

// MARK: - Keep in sync with targets/realbarber-widget/RBReservationAttributes.swift

struct RBReservationAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var subtitle: String
    public var title: String
    public var branchName: String
    public var detailLine: String
    public var startAt: String
    public var endAt: String
    public var progress01: Double
    /// `#RRGGBB`; nil / chybějící při decode → černobílý progress ve widgetu.
    public var accentHex: String?
  }

  public var deepLink: String
}

private func rbString(_ value: Any?) -> String {
  if let s = value as? String { return s }
  if let s = value as? NSString { return s as String }
  return ""
}

private func rbProgress01(_ value: Any?) -> Double {
  if let n = value as? NSNumber { return n.doubleValue }
  if let n = value as? Double { return n }
  if let n = value as? Int { return Double(n) }
  return -1
}

private func contentState(from payload: NSDictionary) -> RBReservationAttributes.ContentState {
  RBReservationAttributes.ContentState(
    subtitle: rbString(payload["subtitle"]),
    title: rbString(payload["title"]),
    branchName: rbString(payload["branchName"]),
    detailLine: rbString(payload["detailLine"]),
    startAt: rbString(payload["startAt"]),
    endAt: rbString(payload["endAt"]),
    progress01: rbProgress01(payload["progress"]),
    accentHex: {
      let h = rbString(payload["accentHex"])
      return h.isEmpty ? nil : h
    }()
  )
}

@available(iOS 16.2, *)
private enum RBActivityStore {
  static var activities: [String: Activity<RBReservationAttributes>] = [:]

  static func remember(_ activity: Activity<RBReservationAttributes>) {
    activities[activity.id] = activity
  }

  static func activity(for id: String) -> Activity<RBReservationAttributes>? {
    activities[id]
  }

  static func remove(id: String) {
    activities.removeValue(forKey: id)
  }

  static func endAll() async {
    let copy = Array(activities.values)
    for act in copy {
      await act.end(nil, dismissalPolicy: .immediate)
    }
    activities.removeAll()
  }

  static var trackedCount: Int {
    activities.count
  }
}

@objc(RBActivityBridge)
class RBActivityBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc
  func startReservationActivity(
    _ payload: NSDictionary,
    deepLink: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }
    if !ActivityAuthorizationInfo().areActivitiesEnabled {
      reject("E_DISABLED", "Live Activities are disabled for this app", nil)
      return
    }
    Task { @MainActor in
      do {
        let attributes = RBReservationAttributes(deepLink: deepLink)
        let state = contentState(from: payload)
        let content = ActivityContent(state: state, staleDate: nil)
        let activity = try Activity<RBReservationAttributes>.request(
          attributes: attributes,
          content: content,
          pushType: nil
        )
        RBActivityStore.remember(activity)
        resolve(activity.id)
      } catch {
        reject("E_START", error.localizedDescription, error)
      }
    }
  }

  @objc
  func updateReservationActivity(
    _ activityId: String,
    payload: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }
    Task { @MainActor in
      guard let activity = RBActivityStore.activity(for: activityId) else {
        reject("E_MISSING", "No Live Activity for id \(activityId)", nil)
        return
      }
      let state = contentState(from: payload)
      let content = ActivityContent(state: state, staleDate: nil)
      await activity.update(content)
      resolve(nil)
    }
  }

  @objc
  func endReservationActivity(
    _ activityId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }
    Task { @MainActor in
      guard let activity = RBActivityStore.activity(for: activityId) else {
        RBActivityStore.remove(id: activityId)
        resolve(nil)
        return
      }
      await activity.end(nil, dismissalPolicy: .immediate)
      RBActivityStore.remove(id: activityId)
      resolve(nil)
    }
  }

  @objc
  func endAllReservationActivities(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }
    Task { @MainActor in
      await RBActivityStore.endAll()
      resolve(nil)
    }
  }

  @objc
  func getReservationActivityCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      resolve(0)
      return
    }
    Task { @MainActor in
      resolve(RBActivityStore.trackedCount)
    }
  }
}
