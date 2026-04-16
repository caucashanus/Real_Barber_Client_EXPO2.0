import ActivityKit
import CryptoKit
import Foundation
import React
import UIKit

private func rbString(_ value: Any?) -> String {
  if let s = value as? String { return s }
  if let s = value as? NSString { return s as String }
  return ""
}

private func rbPhase(_ value: Any?) -> RBReservationPhase {
  let raw = rbString(value).trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  return RBReservationPhase(rawValue: raw) ?? .scheduled
}

private func rbPresentation(_ value: Any?) -> RBReservationPresentation {
  let raw = rbString(value).trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
  return RBReservationPresentation(rawValue: raw) ?? .normal
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

private func rbWriteAvatarToAppGroup(fromRemoteURL remote: URL, bearerToken: String?) async -> String? {
  guard let scheme = remote.scheme?.lowercased(), scheme == "http" || scheme == "https" else { return nil }
  guard let dir = rbAvatarDirURL() else { return nil }
  rbEnsureDir(dir)

  let key = rbSHA256Hex(remote.absoluteString)
  let fileURL = dir.appendingPathComponent("\(key).jpg", isDirectory: false)
  let path = fileURL.path
  if FileManager.default.fileExists(atPath: path) {
    if let attrs = try? FileManager.default.attributesOfItem(atPath: path),
       let size = attrs[.size] as? NSNumber,
       size.intValue > 0,
       UIImage(contentsOfFile: path) != nil {
      return path
    }
    try? FileManager.default.removeItem(atPath: path)
  }

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
    return UIImage(contentsOfFile: path) == nil ? nil : path
  } catch {
    return nil
  }
}

private func rbResolveEmployeeAvatarFilePath(from payload: NSDictionary) async -> String? {
  let avatarRemote = rbString(payload["employeeAvatarUrl"]).trimmingCharacters(in: .whitespacesAndNewlines)
  let token = rbString(payload["employeeAvatarAuthToken"]).trimmingCharacters(in: .whitespacesAndNewlines)
  if let avatarURL = rbResolvedAvatarRemoteURL(from: avatarRemote) {
    if !token.isEmpty,
       let p = await rbWriteAvatarToAppGroup(fromRemoteURL: avatarURL, bearerToken: token) {
      return p
    }
    if let p = await rbWriteAvatarToAppGroup(fromRemoteURL: avatarURL, bearerToken: nil) {
      return p
    }
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

private func contentState(
  from payload: NSDictionary,
  employeeAvatarFilePath: String?
) -> RBReservationAttributes.ContentState {
  RBReservationAttributes.ContentState(
    phase: rbPhase(payload["phase"]),
    presentation: rbPresentation(payload["presentation"]),
    labelText: {
      let value = rbString(payload["labelText"])
      return value.isEmpty ? nil : value
    }(),
    headlineText: {
      let value = rbString(payload["headlineText"])
      return value.isEmpty ? nil : value
    }(),
    detailText: {
      let value = rbString(payload["detailText"])
      return value.isEmpty ? nil : value
    }(),
    startAt: rbString(payload["startAt"]),
    endAt: rbString(payload["endAt"]),
    branchName: rbString(payload["branchName"]),
    timeRangeText: rbString(payload["timeRangeText"]),
    employeeName: rbString(payload["employeeName"]),
    employeeAvatarUrl: {
      let value = rbString(payload["employeeAvatarUrl"])
      return value.isEmpty ? nil : value
    }(),
    employeeAvatarFilePath: employeeAvatarFilePath,
    accentHex: {
      let value = rbString(payload["accentHex"])
      return value.isEmpty ? nil : value
    }(),
    priceFormatted: {
      let value = rbString(payload["priceFormatted"])
      return value.isEmpty ? nil : value
    }()
  )
}

private actor RBPushTokenRegistryActor {
  static let shared = RBPushTokenRegistryActor()
  private var hexByActivity: [String: String] = [:]
  private var observationTasks: [String: Task<Void, Never>] = [:]

  func hex(for activityId: String) -> String? {
    hexByActivity[activityId]
  }

  func cancelObservation(activityId: String) {
    observationTasks[activityId]?.cancel()
    observationTasks[activityId] = nil
    hexByActivity.removeValue(forKey: activityId)
  }

  func cancelAllObservations() {
    for (_, task) in observationTasks {
      task.cancel()
    }
    observationTasks.removeAll()
    hexByActivity.removeAll()
  }

  func startObservingPushToken(for activity: Activity<RBReservationAttributes>) {
    let activityId = activity.id
    observationTasks[activityId]?.cancel()
    let task = Task { [weak self] in
      for await pushToken in activity.pushTokenUpdates {
        let hex = pushToken.reduce(into: "") { $0.append(String(format: "%02x", $1)) }
        await self?.setHex(hex, for: activityId)
      }
      await self?.clearTask(activityId)
    }
    observationTasks[activityId] = task
  }

  private func setHex(_ hex: String, for activityId: String) {
    hexByActivity[activityId] = hex
  }

  private func clearTask(_ activityId: String) {
    observationTasks[activityId] = nil
  }
}

@available(iOS 16.2, *)
@MainActor
private enum RBActivityStore {
  static var activities: [String: Activity<RBReservationAttributes>] = [:]
  static var avatarPathByActivityId: [String: String] = [:]

  static func remember(_ activity: Activity<RBReservationAttributes>) {
    activities[activity.id] = activity
  }

  static func allActivities() -> [Activity<RBReservationAttributes>] {
    var byId = activities
    for activity in Activity<RBReservationAttributes>.activities {
      byId[activity.id] = activity
    }
    return Array(byId.values)
  }

  static func activity(for id: String) -> Activity<RBReservationAttributes>? {
    if let tracked = activities[id] { return tracked }
    if let system = Activity<RBReservationAttributes>.activities.first(where: { $0.id == id }) {
      remember(system)
      return system
    }
    return nil
  }

  static func activities(for bookingId: String) -> [Activity<RBReservationAttributes>] {
    let matched = allActivities().filter { $0.attributes.bookingId == bookingId }
    for activity in matched {
      remember(activity)
    }
    return matched
  }

  static func remove(id: String) {
    activities.removeValue(forKey: id)
    Task { await RBPushTokenRegistryActor.shared.cancelObservation(activityId: id) }
    if let p = avatarPathByActivityId.removeValue(forKey: id), !p.isEmpty {
      try? FileManager.default.removeItem(atPath: p)
    }
  }

  static func end(_ activity: Activity<RBReservationAttributes>) async {
    await activity.end(nil, dismissalPolicy: .immediate)
    remove(id: activity.id)
  }

  static func endAll() async {
    let copy = allActivities()
    for activity in copy {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
    activities.removeAll()
    await RBPushTokenRegistryActor.shared.cancelAllObservations()
    let paths = Array(avatarPathByActivityId.values)
    avatarPathByActivityId.removeAll()
    for p in paths where !p.isEmpty {
      try? FileManager.default.removeItem(atPath: p)
    }
  }

  static var trackedCount: Int {
    allActivities().count
  }
}

@objc(RBActivityBridge)
class RBActivityBridge: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc
  func startReservationActivity(
    _ payload: NSDictionary,
    bookingId: String,
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

    let trimmedBookingId = bookingId.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmedBookingId.isEmpty {
      reject("E_INVALID_BOOKING", "Missing bookingId for Live Activity", nil)
      return
    }

    Task {
      do {
        let avatarPath = await rbResolveEmployeeAvatarFilePath(from: payload)
        let state = contentState(from: payload, employeeAvatarFilePath: avatarPath)

        try await MainActor.run {
          let attributes = RBReservationAttributes(
            bookingId: trimmedBookingId,
            deepLink: deepLink
          )
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
          Task { await RBPushTokenRegistryActor.shared.startObservingPushToken(for: activity) }
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
    Task {
      let hex = await RBPushTokenRegistryActor.shared.hex(for: activityId)
      await MainActor.run {
        resolve(hex ?? NSNull())
      }
    }
  }

  @available(iOS 16.2, *)
  private func buildContent(
    activityId: String,
    payload: NSDictionary
  ) async -> ActivityContent<RBReservationAttributes.ContentState> {
    let avatarPath = await rbResolveEmployeeAvatarFilePath(from: payload)
    return await MainActor.run {
      if let newPath = avatarPath, !newPath.isEmpty {
        let oldPath = RBActivityStore.avatarPathByActivityId[activityId]
        if let oldPath, oldPath != newPath {
          try? FileManager.default.removeItem(atPath: oldPath)
        }
        RBActivityStore.avatarPathByActivityId[activityId] = newPath
      }
      let effectivePath = avatarPath ?? RBActivityStore.avatarPathByActivityId[activityId]
      let state = contentState(from: payload, employeeAvatarFilePath: effectivePath)
      return ActivityContent(state: state, staleDate: nil)
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
      guard let activity = await MainActor.run(body: { RBActivityStore.activity(for: activityId) }) else {
        reject("E_MISSING", "No Live Activity for id \(activityId)", nil)
        return
      }
      let content = await buildContent(activityId: activity.id, payload: payload)
      await activity.update(content)
      await MainActor.run {
        RBActivityStore.remember(activity)
        resolve(nil)
      }
    }
  }

  @objc
  func updateReservationActivitiesForBooking(
    _ bookingId: String,
    payload: NSDictionary,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }

    let needle = bookingId.trimmingCharacters(in: .whitespacesAndNewlines)
    if needle.isEmpty {
      resolve(0)
      return
    }

    Task {
      let activities = await MainActor.run(body: { RBActivityStore.activities(for: needle) })
      var updated = 0
      for activity in activities {
        let content = await buildContent(activityId: activity.id, payload: payload)
        await activity.update(content)
        updated += 1
      }
      await MainActor.run {
        for activity in activities {
          RBActivityStore.remember(activity)
        }
        resolve(updated)
      }
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

    Task {
      let activity = await MainActor.run(body: { RBActivityStore.activity(for: activityId) })
      guard let activity else {
        await MainActor.run {
          RBActivityStore.remove(id: activityId)
          resolve(nil)
        }
        return
      }
      await MainActor.run {
        RBActivityStore.remember(activity)
      }
      await activity.end(nil, dismissalPolicy: .immediate)
      await MainActor.run {
        RBActivityStore.remove(id: activity.id)
        resolve(nil)
      }
    }
  }

  @objc
  func endReservationActivitiesForBooking(
    _ bookingId: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }

    let needle = bookingId.trimmingCharacters(in: .whitespacesAndNewlines)
    if needle.isEmpty {
      resolve(0)
      return
    }

    Task {
      let activities = await MainActor.run(body: { RBActivityStore.activities(for: needle) })
      for activity in activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      await MainActor.run {
        for activity in activities {
          RBActivityStore.remove(id: activity.id)
        }
        resolve(activities.count)
      }
    }
  }

  @objc
  func cleanupReservationActivities(
    _ keepBookingIds: [String],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("E_UNSUPPORTED", "Live Activity requires iOS 16.2+", nil)
      return
    }

    let keep = Set(
      keepBookingIds
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
    )

    Task {
      let activities = await MainActor.run(body: { RBActivityStore.allActivities() })
      var removed = 0
      for activity in activities where !keep.contains(activity.attributes.bookingId) {
        await activity.end(nil, dismissalPolicy: .immediate)
        removed += 1
      }
      await MainActor.run {
        for activity in activities where !keep.contains(activity.attributes.bookingId) {
          RBActivityStore.remove(id: activity.id)
        }
        resolve(removed)
      }
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
