import ActivityKit
import CryptoKit
import Foundation
import React
import UIKit

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
    public var employeeAvatarFilePath: String?
    public var progress01: Double
    /// `#RRGGBB`; nil / chybějící při decode → černobílý progress ve widgetu.
    public var accentHex: String?
    public var priceFormatted: String?
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

private let kRBAppGroup = "group.com.realbarber.client"
private let kRBCrmOrigin = "https://crm.xrb.cz"

private func rbResolvedAvatarRemoteURL(from raw: String) -> URL? {
  let t = raw.trimmingCharacters(in: .whitespacesAndNewlines)
  if t.isEmpty { return nil }
  if let u = URL(string: t), let scheme = u.scheme?.lowercased(), scheme == "http" || scheme == "https" {
    return u
  }
  if t.hasPrefix("//"), let u = URL(string: "https:\(t)") { return u }
  if t.hasPrefix("/"), let base = URL(string: kRBCrmOrigin) {
    return URL(string: t, relativeTo: base)?.absoluteURL
  }
  return URL(string: t)
}

private func rbSHA256Hex(_ s: String) -> String {
  let digest = SHA256.hash(data: Data(s.utf8))
  return digest.map { String(format: "%02x", $0) }.joined()
}

private func rbAvatarDirURL() -> URL? {
  FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: kRBAppGroup)?
    .appendingPathComponent("rb-live-activity", isDirectory: true)
    .appendingPathComponent("avatars", isDirectory: true)
}

private func rbEnsureDir(_ url: URL) {
  try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
}

private func rbNormalizeAvatarImageData(_ data: Data) -> Data? {
  guard let image = UIImage(data: data) else {
    return data.count <= 400_000 ? data : nil
  }
  let maxSide: CGFloat = 256
  let size = image.size
  guard size.width > 0, size.height > 0 else {
    return image.jpegData(compressionQuality: 0.82)
  }
  let scale = min(1, min(maxSide / size.width, maxSide / size.height))
  let newW = max(1, floor(size.width * scale))
  let newH = max(1, floor(size.height * scale))
  let newSize = CGSize(width: newW, height: newH)
  let format = UIGraphicsImageRendererFormat()
  format.scale = 1
  let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
  let rendered = renderer.image { _ in
    image.draw(in: CGRect(origin: .zero, size: newSize))
  }
  return rendered.jpegData(compressionQuality: 0.82)
}

private func rbWriteAvatarDataToAppGroup(data: Data) -> String? {
  guard let dir = rbAvatarDirURL() else { return nil }
  rbEnsureDir(dir)
  guard let jpeg = rbNormalizeAvatarImageData(data) else { return nil }
  let fileURL = dir.appendingPathComponent(UUID().uuidString + ".jpg", isDirectory: false)
  do {
    try jpeg.write(to: fileURL, options: [.atomic])
    return fileURL.path
  } catch {
    return nil
  }
}

private func rbResolveEmployeeAvatarFilePath(from payload: NSDictionary) async -> String? {
  let avatarRemote = rbString(payload["employeeAvatarUrl"]).trimmingCharacters(in: .whitespacesAndNewlines)
  let token = rbString(payload["employeeAvatarAuthToken"]).trimmingCharacters(in: .whitespacesAndNewlines)
  if let avatarURL = rbResolvedAvatarRemoteURL(from: avatarRemote) {
    if !token.isEmpty {
      if let p = await rbWriteAvatarToAppGroup(fromRemoteURL: avatarURL, bearerToken: token) { return p }
    }
    if let p = await rbWriteAvatarToAppGroup(fromRemoteURL: avatarURL, bearerToken: nil) { return p }
  }
  let b64 = rbString(payload["employeeAvatarBase64"]).trimmingCharacters(in: .whitespacesAndNewlines)
  if !b64.isEmpty {
    if let data = Data(base64Encoded: b64), !data.isEmpty {
      return rbWriteAvatarDataToAppGroup(data: data)
    }
    if let data = Data(base64Encoded: b64, options: [.ignoreUnknownCharacters]), !data.isEmpty {
      return rbWriteAvatarDataToAppGroup(data: data)
    }
  }
  return nil
}

private func rbWriteAvatarToAppGroup(fromRemoteURL remote: URL, bearerToken: String?) async -> String? {
  guard let scheme = remote.scheme?.lowercased(), scheme == "http" || scheme == "https" else { return nil }
  guard let dir = rbAvatarDirURL() else { return nil }
  rbEnsureDir(dir)

  let key = rbSHA256Hex(remote.absoluteString)
  let fileURL = dir.appendingPathComponent("\(key).jpg", isDirectory: false)
  let path = fileURL.path
  if FileManager.default.fileExists(atPath: path) { return path }

  do {
    var request = URLRequest(url: remote)
    request.setValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      forHTTPHeaderField: "User-Agent"
    )
    request.setValue(remote.absoluteString, forHTTPHeaderField: "Referer")
    if let t = bearerToken?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
      request.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
    }
    let (data, resp) = try await URLSession.shared.data(for: request)
    if let http = resp as? HTTPURLResponse, http.statusCode >= 400 { return nil }
    if data.isEmpty { return nil }
    guard let normalized = rbNormalizeAvatarImageData(data) else { return nil }
    try normalized.write(to: fileURL, options: [.atomic])
    return path
  } catch {
    return nil
  }
}

private func contentState(from payload: NSDictionary, employeeAvatarFilePath: String?) -> RBReservationAttributes.ContentState {
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
    employeeAvatarFilePath: employeeAvatarFilePath,
    progress01: rbProgress01(payload["progress"]),
    accentHex: {
      let h = rbString(payload["accentHex"])
      return h.isEmpty ? nil : h
    }(),
    priceFormatted: {
      let p = rbString(payload["priceFormatted"])
      return p.isEmpty ? nil : p
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
  static var avatarPathByActivityId: [String: String] = [:]

  static func remember(_ activity: Activity<RBReservationAttributes>) {
    activities[activity.id] = activity
  }

  static func activity(for id: String) -> Activity<RBReservationAttributes>? {
    activities[id]
  }

  static func remove(id: String) {
    activities.removeValue(forKey: id)
    RBPushTokenRegistry.cancelObservation(activityId: id)
    if let p = avatarPathByActivityId.removeValue(forKey: id), !p.isEmpty {
      try? FileManager.default.removeItem(atPath: p)
    }
  }

  static func endAll() async {
    let copy = Array(activities.values)
    for act in copy {
      await act.end(nil, dismissalPolicy: .immediate)
    }
    activities.removeAll()
    RBPushTokenRegistry.cancelAllObservations()
    let paths = Array(avatarPathByActivityId.values)
    avatarPathByActivityId.removeAll()
    for p in paths where !p.isEmpty {
      try? FileManager.default.removeItem(atPath: p)
    }
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
    Task {
      do {
        let avatarPath = await rbResolveEmployeeAvatarFilePath(from: payload)

        try await MainActor.run {
          let attributes = RBReservationAttributes(deepLink: deepLink)
          let state = contentState(from: payload, employeeAvatarFilePath: avatarPath)
          let content = ActivityContent(state: state, staleDate: nil)
          let activity = try Activity<RBReservationAttributes>.request(
            attributes: attributes,
            content: content,
            pushType: .token
          )
          RBActivityStore.remember(activity)
          if let p = avatarPath, !p.isEmpty {
            RBActivityStore.avatarPathByActivityId[activity.id] = p
          }
          RBPushTokenRegistry.startObservingPushToken(for: activity)
          resolve(activity.id)
        }
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
    Task {
      guard #available(iOS 16.2, *) else {
        reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
        return
      }

      guard let activity = await MainActor.run(body: { RBActivityStore.activity(for: activityId) }) else {
        reject("E_MISSING", "No Live Activity for id \(activityId)", nil)
        return
      }

      let avatarPath = await rbResolveEmployeeAvatarFilePath(from: payload)

      let content: ActivityContent<RBReservationAttributes.ContentState> = await MainActor.run {
        if let newPath = avatarPath, !newPath.isEmpty {
          let old = RBActivityStore.avatarPathByActivityId[activityId]
          if let old, old != newPath {
            try? FileManager.default.removeItem(atPath: old)
          }
          RBActivityStore.avatarPathByActivityId[activityId] = newPath
        }

        let effectivePath = avatarPath ?? RBActivityStore.avatarPathByActivityId[activityId]
        let state = contentState(from: payload, employeeAvatarFilePath: effectivePath)
        return ActivityContent(state: state, staleDate: nil)
      }

      await activity.update(content)
      await MainActor.run { resolve(nil) }
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
