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
    public var employeeName: String
    public var employeeAvatarUrl: String?
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
    employeeName: rbString(payload["employeeName"]),
    employeeAvatarUrl: {
      let u = rbString(payload["employeeAvatarUrl"])
      return u.isEmpty ? nil : u
    }(),
    progress01: rbProgress01(payload["progress"]),
    accentHex: {
      let h = rbString(payload["accentHex"])
      return h.isEmpty ? nil : h
    }()
  )
}

// MARK: - ActivityKit push token (hex) pro APNs `liveactivity`

private enum RBPushTokenRegistry {
  private static let lock = NSLock()
  private static var hexByActivity: [String: String] = [:]
  private static var observationTasks: [String: Task<Void, Never>] = [:]

  static func hex(for activityId: String) -> String? {
    lock.lock()
    defer { lock.unlock() }
    return hexByActivity[activityId]
  }

  static func cancelObservation(activityId: String) {
    lock.lock()
    observationTasks[activityId]?.cancel()
    observationTasks[activityId] = nil
    hexByActivity.removeValue(forKey: activityId)
    lock.unlock()
  }

  static func cancelAllObservations() {
    lock.lock()
    for (_, t) in observationTasks { t.cancel() }
    observationTasks.removeAll()
    hexByActivity.removeAll()
    lock.unlock()
  }

  @MainActor
  static func startObservingPushToken(for activity: Activity<RBReservationAttributes>) {
    let activityId = activity.id
    lock.lock()
    observationTasks[activityId]?.cancel()
    let task = Task {
      for await pushToken in activity.pushTokenUpdates {
        let hex = pushToken.reduce(into: "") { $0.append(String(format: "%02x", $1)) }
        lock.lock()
        hexByActivity[activityId] = hex
        lock.unlock()
      }
      lock.lock()
      observationTasks[activityId] = nil
      lock.unlock()
    }
    observationTasks[activityId] = task
    lock.unlock()
  }
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
    RBPushTokenRegistry.cancelObservation(activityId: id)
  }

  static func endAll() async {
    let copy = Array(activities.values)
    for act in copy {
      await act.end(nil, dismissalPolicy: .immediate)
    }
    activities.removeAll()
    RBPushTokenRegistry.cancelAllObservations()
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
          pushType: .token
        )
        RBActivityStore.remember(activity)
        RBPushTokenRegistry.startObservingPushToken(for: activity)
        resolve(activity.id)
      } catch {
        reject("E_START", error.localizedDescription, error)
      }
    }
  }

  @objc
  func getLiveActivityPushToken(
    _ activityId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      resolve(NSNull())
      return
    }
    if let hex = RBPushTokenRegistry.hex(for: activityId) {
      resolve(hex)
    } else {
      resolve(NSNull())
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
