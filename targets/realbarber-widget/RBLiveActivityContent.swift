import ActivityKit
import Foundation

enum RBReservationPhase: String, Codable, Hashable {
  case scheduled
  case active
  case finished
}

enum RBReservationPresentation: String, Codable, Hashable {
  case normal
  case rescheduled
  case cancelled
  case review
}

struct RBReservationAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var phase: RBReservationPhase
    public var presentation: RBReservationPresentation
    /// Optional display label provided by app/server. Never used to infer state.
    public var labelText: String?
    /// Optional display headline provided by app/server. Never used to infer state.
    public var headlineText: String?
    /// Optional detail/call-to-action line provided by app/server.
    public var detailText: String?
    public var startAt: String
    public var endAt: String
    public var branchName: String
    public var timeRangeText: String
    public var employeeName: String
    public var employeeAvatarUrl: String?
    /// Local file path (App Group) for reliable rendering in Live Activities.
    public var employeeAvatarFilePath: String?
    public var accentHex: String?
    public var priceFormatted: String?
  }

  public var bookingId: String
  public var deepLink: String
}
