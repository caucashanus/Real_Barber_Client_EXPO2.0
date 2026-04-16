import SwiftUI
import UIKit

private let rbProgressTrackColor = Color.white.opacity(0.22)

private func rbParseISODate(_ s: String) -> Date? {
  let iso = ISO8601DateFormatter()
  iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  if let d = iso.date(from: s) { return d }
  iso.formatOptions = [.withInternetDateTime]
  return iso.date(from: s)
}

private func rbTrim(_ s: String?) -> String {
  (s ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
}

private func rbMinutesRemainingCeil(target: Date, now: Date) -> Int {
  guard target > now else { return 0 }
  let diff = target.timeIntervalSince(now)
  if !diff.isFinite || diff <= 0 { return 0 }
  return max(1, Int(ceil(diff / 60)))
}

private func rbProgressFillColor(accentHex: String) -> Color {
  var s = accentHex.trimmingCharacters(in: .whitespacesAndNewlines)
  if s.hasPrefix("#") { s.removeFirst() }
  guard s.count == 6, let v = UInt64(s, radix: 16) else {
    return Color.white
  }
  let r = Double((v >> 16) & 0xFF) / 255
  let g = Double((v >> 8) & 0xFF) / 255
  let b = Double(v & 0xFF) / 255
  return Color(red: r, green: g, blue: b)
}

private enum RBBrandLogoImage {
  static func swiftUIImage() -> Image {
    if let ui = UIImage(named: "rbLogo") {
      return Image(uiImage: ui)
    }
    if let path = Bundle.main.path(forResource: "rbLogo", ofType: "png"),
       let ui = UIImage(contentsOfFile: path) {
      return Image(uiImage: ui)
    }
    return Image(systemName: "scissors")
  }
}

struct RBBrandLogo: View {
  var size: CGFloat = 28

  var body: some View {
    RBBrandLogoImage.swiftUIImage()
      .renderingMode(.original)
      .resizable()
      .scaledToFit()
      .frame(width: size, height: size)
      .clipShape(RoundedRectangle(cornerRadius: size * 0.22, style: .continuous))
  }
}

private struct RBEmployeeAvatarView: View {
  let filePath: String?
  var size: CGFloat = 32

  var body: some View {
    if let path = filePath, !path.isEmpty, let ui = UIImage(contentsOfFile: path) {
      Image(uiImage: ui)
        .resizable()
        .scaledToFill()
        .frame(width: size, height: size)
        .clipShape(Circle())
    } else {
      EmptyView()
    }
  }
}

private struct RBUpcomingBrandLogoCluster: View {
  let avatarFilePath: String?
  var logoSize: CGFloat = 52
  var avatarSize: CGFloat = 34

  private var avatarYOffset: CGFloat {
    logoSize > 48 ? 20 : 14
  }

  var body: some View {
    RBBrandLogo(size: logoSize)
      .overlay(alignment: .center) {
        RBEmployeeAvatarView(filePath: avatarFilePath, size: avatarSize)
          .offset(x: -17, y: avatarYOffset)
          .shadow(color: .black.opacity(0.4), radius: 3, x: 0, y: 1)
      }
  }
}

private struct RBTimeRangePill: View {
  let text: String
  var compact: Bool = false

  var body: some View {
    Text(text)
      .font(compact ? .caption2 : .caption)
      .foregroundStyle(.secondary)
      .padding(.horizontal, compact ? 10 : 12)
      .padding(.vertical, compact ? 5 : 7)
      .background(
        Capsule(style: .continuous)
          .fill(Color.white.opacity(0.18))
      )
  }
}

private struct RBDetailBag: View {
  let text: String
  var compact: Bool = false

  var body: some View {
    Text(text)
      .font(compact ? .caption2 : .caption)
      .fontWeight(.semibold)
      .foregroundStyle(.secondary)
      .padding(.horizontal, compact ? 10 : 12)
      .padding(.vertical, compact ? 5 : 7)
      .background(
        RoundedRectangle(cornerRadius: compact ? 8 : 11, style: .continuous)
          .fill(Color.white.opacity(0.09))
      )
      .overlay(
        RoundedRectangle(cornerRadius: compact ? 8 : 11, style: .continuous)
          .stroke(Color.white.opacity(0.24), lineWidth: 1)
      )
  }
}

private struct RBPriceBag: View {
  let text: String
  var compact: Bool = false

  var body: some View {
    RBDetailBag(text: text, compact: compact)
  }
}

private struct RBPulsingDot: View {
  let color: Color
  var size: CGFloat = 10

  var body: some View {
    let dot = Image(systemName: "circle.fill")
      .font(.system(size: size, weight: .bold))
      .foregroundStyle(color)
      .shadow(color: color.opacity(0.85), radius: size * 0.65, x: 0, y: 0)
      .shadow(color: color.opacity(0.45), radius: size * 1.25, x: 0, y: 0)
      .accessibilityHidden(true)

    if #available(iOS 17.0, *) {
      dot.symbolEffect(.pulse, options: .repeating)
    } else {
      dot
    }
  }
}

private struct RBLiveActivityProgressBar: View {
  let progress01: Double
  let accentHex: String
  var maxWidth: CGFloat? = nil

  var body: some View {
    let p = min(1, max(0, progress01))
    let fill = rbProgressFillColor(accentHex: accentHex)
    let barHeight: CGFloat = 12
    let knobSize: CGFloat = 18

    GeometryReader { geo in
      let w = geo.size.width
      ZStack(alignment: .leading) {
        Capsule()
          .fill(rbProgressTrackColor)
          .frame(height: barHeight)
        Capsule()
          .fill(fill)
          .frame(width: max(0, w * p), height: barHeight)
        Circle()
          .fill(fill)
          .frame(width: knobSize, height: knobSize)
          .shadow(color: .black.opacity(0.12), radius: 1, x: 0, y: 1)
          .offset(x: max(0, w * p - (knobSize / 2)))
      }
    }
    .frame(height: max(knobSize, barHeight))
    .frame(maxWidth: maxWidth, alignment: .leading)
  }
}

private struct RBReservationLiveDisplayModel {
  let state: RBReservationAttributes.ContentState
  let now: Date
  let startDate: Date?
  let endDate: Date?

  init(state: RBReservationAttributes.ContentState, now: Date) {
    self.state = state
    self.now = now
    startDate = rbParseISODate(state.startAt)
    endDate = rbParseISODate(state.endAt)
  }

  var isScheduledNormal: Bool {
    state.presentation == .normal && state.phase == .scheduled
  }

  var isActiveNormal: Bool {
    state.presentation == .normal && state.phase == .active
  }

  var isFinishedNormal: Bool {
    state.presentation == .normal && state.phase == .finished
  }

  var isRescheduled: Bool {
    state.presentation == .rescheduled
  }

  var isCancelled: Bool {
    state.presentation == .cancelled
  }

  var isReview: Bool {
    state.presentation == .review
  }

  var labelText: String {
    let override = rbTrim(state.labelText)
    if !override.isEmpty { return override }
    switch state.presentation {
    case .normal:
      switch state.phase {
      case .scheduled:
        return "Začátek za"
      case .active:
        return ""
      case .finished:
        return "Rezervace skončila"
      }
    case .rescheduled:
      return "Rezervace přesunuta"
    case .cancelled:
      return "Rezervace zrušena"
    case .review:
      return "Ohodnoťte rezervaci"
    }
  }

  var headlineText: String {
    let override = rbTrim(state.headlineText)
    if !override.isEmpty { return override }
    switch state.presentation {
    case .normal:
      switch state.phase {
      case .scheduled, .active:
        return ""
      case .finished:
        return "Dokončeno"
      }
    case .rescheduled:
      return "Změna rezervace"
    case .cancelled:
      return "Zrušeno"
    case .review:
      return "Děkujeme!"
    }
  }

  var detailText: String {
    rbTrim(state.detailText)
  }

  var branchName: String {
    rbTrim(state.branchName)
  }

  var employeeName: String {
    rbTrim(state.employeeName)
  }

  var timeRangeText: String {
    rbTrim(state.timeRangeText)
  }

  var priceText: String {
    rbTrim(state.priceFormatted)
  }

  var countdownTarget: Date? {
    guard isScheduledNormal else { return nil }
    return startDate
  }

  var progress01: Double? {
    guard state.presentation == .normal else { return nil }
    guard let start = startDate, let end = endDate else { return nil }
    switch state.phase {
    case .scheduled:
      let lookAheadWindow: Double = 60 * 60
      let secondsToStart = start.timeIntervalSince(now)
      guard secondsToStart.isFinite else { return nil }
      let p = 1 - (secondsToStart / lookAheadWindow)
      return min(1, max(0, p))
    case .active:
      let total = end.timeIntervalSince(start)
      guard total.isFinite, total > 0 else { return nil }
      let elapsed = now.timeIntervalSince(start)
      let p = elapsed / total
      return min(1, max(0, p))
    case .finished:
      return nil
    }
  }

  var compactTrailingText: String? {
    if isRescheduled { return "Změna" }
    guard let target = countdownTarget else { return nil }
    let diff = target.timeIntervalSince(now)
    if diff > 0 && diff <= 120 {
      return "Za chvíli"
    }
    if diff > 0 {
      return "\(rbMinutesRemainingCeil(target: target, now: now)) min"
    }
    return "0 min"
  }
}

private struct RBUpcomingBranchEmployeeRow: View {
  let model: RBReservationLiveDisplayModel
  var compact: Bool = false

  var body: some View {
    HStack(spacing: 0) {
      if !model.branchName.isEmpty {
        Text(model.branchName)
      }
      if !model.branchName.isEmpty && !model.employeeName.isEmpty {
        Text(" · ")
          .foregroundStyle(.tertiary)
      }
      if !model.employeeName.isEmpty {
        Text(model.employeeName)
      }
      Spacer(minLength: 0)
    }
    .font(compact ? .caption2 : .footnote)
    .foregroundStyle(.secondary)
    .lineLimit(1)
    .minimumScaleFactor(0.78)
  }
}

private struct RBReservationLockScreenContent: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    ZStack(alignment: .trailing) {
      VStack(alignment: .leading, spacing: 8) {
        if model.isActiveNormal {
          HStack(spacing: 10) {
            RBEmployeeAvatarView(filePath: model.state.employeeAvatarFilePath, size: 32)
            VStack(alignment: .leading, spacing: 2) {
              if !model.employeeName.isEmpty {
                Text(model.employeeName)
                  .font(.headline)
                  .fontWeight(.bold)
              }
              HStack(spacing: 8) {
                RBPulsingDot(
                  color: Color(red: 0.43, green: 0.87, blue: 0.37),
                  size: 16
                )
                Text("Probíhá")
                  .font(.footnote)
                  .foregroundStyle(.secondary)
              }
              if !model.priceText.isEmpty {
                RBPriceBag(text: model.priceText, compact: false)
                  .padding(.top, 4)
              }
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        } else {
          if !model.labelText.isEmpty {
            Text(model.labelText)
              .font(.subheadline)
              .foregroundStyle(.secondary)
          }

          if model.isCancelled {
            HStack(spacing: 10) {
              Text(model.headlineText)
                .font(.title2)
                .fontWeight(.bold)
              RBPulsingDot(color: .red, size: 20)
            }
          } else if model.isReview || model.isRescheduled || model.isFinishedNormal {
            Text(model.headlineText)
              .font(.title2)
              .fontWeight(.bold)
          } else if let target = model.countdownTarget {
            let diff = target.timeIntervalSince(model.now)
            ZStack(alignment: .leading) {
              Text(timerInterval: model.now...target, countsDown: true)
                .hidden()
              if diff > 0 && diff <= 120 {
                Text("Za chvíli")
              } else if diff > 0 {
                Text("\(rbMinutesRemainingCeil(target: target, now: model.now)) min")
              } else {
                Text("0 min")
              }
            }
            .font(.title2)
            .fontWeight(.bold)
            .monospacedDigit()
          }
        }

        if let progress = model.progress01 {
          RBLiveActivityProgressBar(
            progress01: progress,
            accentHex: model.state.accentHex ?? "",
            maxWidth: 240
          )
        }

        if model.isScheduledNormal {
          RBUpcomingBranchEmployeeRow(model: model, compact: false)
          if !model.timeRangeText.isEmpty {
            RBTimeRangePill(text: model.timeRangeText, compact: false)
          }
        } else if model.isRescheduled {
          if !model.employeeName.isEmpty {
            Text(model.employeeName)
              .font(.footnote)
              .foregroundStyle(.secondary)
          }
          if !model.timeRangeText.isEmpty {
            RBTimeRangePill(text: model.timeRangeText, compact: false)
          }
          if !model.detailText.isEmpty {
            RBDetailBag(text: model.detailText, compact: false)
          }
        } else {
          if !model.branchName.isEmpty {
            Text(model.branchName)
              .font(.footnote)
              .foregroundStyle(.secondary)
          }
          if !model.detailText.isEmpty {
            Text(model.detailText)
              .font(.caption)
              .foregroundStyle(.tertiary)
          } else if !model.timeRangeText.isEmpty && !model.isActiveNormal {
            Text(model.timeRangeText)
              .font(.caption)
              .foregroundStyle(.tertiary)
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .frame(minHeight: model.isActiveNormal ? 128 : nil, alignment: .topLeading)
      .padding(.trailing, 62)

      VStack {
        Spacer(minLength: 0)
        if model.isScheduledNormal {
          RBUpcomingBrandLogoCluster(
            avatarFilePath: model.state.employeeAvatarFilePath,
            logoSize: 52,
            avatarSize: 34
          )
        } else {
          RBBrandLogo(size: 52)
        }
        Spacer(minLength: 0)
      }
      .frame(width: 56)
    }
    .padding()
  }
}

struct RBReservationLiveActivityCard: View {
  let state: RBReservationAttributes.ContentState
  let deepLink: String

  init(state: RBReservationAttributes.ContentState, deepLink: String) {
    self.state = state
    self.deepLink = deepLink
  }

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationLockScreenContent(model: model)
    }
    .widgetURL(URL(string: deepLink))
  }
}

private struct RBReservationIslandExpandedLeading: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      if !model.labelText.isEmpty {
        Text(model.labelText)
          .font(.caption)
          .foregroundStyle(.secondary)
          .lineLimit(1)
      }

      if model.isCancelled {
        HStack(spacing: 8) {
          Text(model.headlineText)
            .font(.headline)
            .fontWeight(.bold)
          RBPulsingDot(color: .red, size: 16)
        }
      } else if model.isRescheduled || model.isReview || model.isFinishedNormal {
        Text(model.headlineText)
          .font(.headline)
          .fontWeight(.bold)
          .lineLimit(1)
      } else if model.isActiveNormal {
        HStack(spacing: 8) {
          RBPulsingDot(color: Color(red: 0.43, green: 0.87, blue: 0.37), size: 16)
          Text("Probíhá")
            .font(.headline)
            .fontWeight(.bold)
        }
      } else if let target = model.countdownTarget {
        let diff = target.timeIntervalSince(model.now)
        ZStack(alignment: .leading) {
          Text(timerInterval: model.now...target, countsDown: true)
            .hidden()
          if diff > 0 && diff <= 120 {
            Text("Za chvíli")
          } else if diff > 0 {
            Text("\(rbMinutesRemainingCeil(target: target, now: model.now)) min")
          } else {
            Text("0 min")
          }
        }
        .font(.title3)
        .fontWeight(.bold)
        .monospacedDigit()
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

private struct RBReservationIslandExpandedTrailing: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    if model.isScheduledNormal {
      RBUpcomingBrandLogoCluster(
        avatarFilePath: model.state.employeeAvatarFilePath,
        logoSize: 44,
        avatarSize: 28
      )
    } else {
      RBBrandLogo(size: 44)
    }
  }
}

private struct RBReservationIslandExpandedBottom: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      if model.isActiveNormal {
        if !model.priceText.isEmpty {
          RBPriceBag(text: model.priceText, compact: true)
        }
      } else if let progress = model.progress01 {
        RBLiveActivityProgressBar(
          progress01: progress,
          accentHex: model.state.accentHex ?? "",
          maxWidth: 200
        )
      }

      if model.isScheduledNormal {
        RBUpcomingBranchEmployeeRow(model: model, compact: true)
        if !model.timeRangeText.isEmpty {
          RBTimeRangePill(text: model.timeRangeText, compact: true)
        }
      } else if model.isRescheduled {
        if !model.employeeName.isEmpty {
          Text(model.employeeName)
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        if !model.detailText.isEmpty {
          RBDetailBag(text: model.detailText, compact: true)
        }
      } else {
        if !model.branchName.isEmpty {
          Text(model.branchName)
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        if !model.detailText.isEmpty {
          Text(model.detailText)
            .font(.caption2)
            .foregroundStyle(.tertiary)
        } else if !model.timeRangeText.isEmpty && !model.isActiveNormal {
          Text(model.timeRangeText)
            .font(.caption2)
            .foregroundStyle(.tertiary)
        }
      }
    }
  }
}

private struct RBReservationIslandCompactTrailing: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    if model.isCancelled {
      RBPulsingDot(color: .red, size: 20)
    } else if model.isReview {
      Image(systemName: "star")
        .font(.system(size: 16, weight: .bold))
        .foregroundStyle(Color.white.opacity(0.8))
    } else if model.isActiveNormal {
      RBPulsingDot(color: Color(red: 0.43, green: 0.87, blue: 0.37), size: 20)
    } else if let compactText = model.compactTrailingText {
      Text(compactText)
        .font(.system(size: 12, weight: .bold, design: .rounded))
        .monospacedDigit()
    } else {
      RBBrandLogo(size: 30)
    }
  }
}

private struct RBReservationIslandMinimal: View {
  let model: RBReservationLiveDisplayModel

  var body: some View {
    if model.isCancelled {
      Image(systemName: "xmark.circle.fill")
        .font(.system(size: 16, weight: .bold))
    } else if model.isReview {
      Image(systemName: "star.fill")
        .font(.system(size: 16, weight: .bold))
    } else if model.isActiveNormal {
      RBPulsingDot(color: Color(red: 0.43, green: 0.87, blue: 0.37), size: 16)
    } else {
      RBBrandLogo(size: 24)
    }
  }
}

struct RBReservationLiveActivityIslandExpandedLeadingView: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationIslandExpandedLeading(model: model)
    }
  }
}

struct RBReservationLiveActivityIslandExpandedTrailingView: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationIslandExpandedTrailing(model: model)
    }
  }
}

struct RBReservationLiveActivityIslandExpandedBottomView: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationIslandExpandedBottom(model: model)
    }
  }
}

struct RBReservationLiveActivityIslandCompactTrailingView: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationIslandCompactTrailing(model: model)
    }
  }
}

struct RBReservationLiveActivityIslandMinimalView: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let model = RBReservationLiveDisplayModel(state: state, now: timeline.date)
      RBReservationIslandMinimal(model: model)
    }
  }
}
