import ActivityKit
import Foundation

// MARK: - Must match native/rb-live-activity/RBActivityBridge.swift (RBReservationAttributes)

struct RBReservationAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Small caption above the headline (e.g. “Začátek za”).
    public var subtitle: String
    /// Large headline (e.g. “9 min”).
    public var title: String
    public var branchName: String
    /// Extra line under branch (e.g. time range).
    public var detailLine: String
    public var startAt: String
    public var endAt: String
    public var employeeName: String
    public var employeeAvatarUrl: String?
    /// Local file path (App Group) for reliable rendering in Live Activities.
    /// Prefer this over `employeeAvatarUrl` (remote URL fetching is unreliable in widget).
    public var employeeAvatarFilePath: String?
    /// 0…1 fill for progress bar; negative hides the bar.
    public var progress01: Double
    /// `#RRGGBB` from app accent; nil / missing → monochrome (white) progress fill.
    public var accentHex: String?
    /// Formatted price for upcoming meta line (e.g. locale currency); optional.
    public var priceFormatted: String?
  }

  public var deepLink: String
}
