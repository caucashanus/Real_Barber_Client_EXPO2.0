import ActivityKit
import SwiftUI
import UIKit
import WidgetKit

/// Kolejnice progressu (neutrální); výplň = accent nebo černobílý fallback (bílá).
private let rbProgressTrackColor = Color.white.opacity(0.22)

private func rbParseISODate(_ s: String) -> Date? {
  // App posílá ISO string přes JS → native. Preferujeme ISO8601 parser.
  let iso = ISO8601DateFormatter()
  iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
  if let d = iso.date(from: s) { return d }
  iso.formatOptions = [.withInternetDateTime]
  return iso.date(from: s)
}

private func rbTrim(_ s: String) -> String {
  s.trimmingCharacters(in: .whitespacesAndNewlines)
}

/// UI fáze z `ContentState` a **aktuálního** času.
///
/// `Text(..., style: .timer)` se obnovuje samostatně, ale `if isActive` / `isUpcoming` z jednoho `Date()`
/// při vzácném překreslení zůstane zastaralé → timer po `startAt` může jít do záporu bez přepnutí na „Probíhá“.
/// `TimelineView` musí dodávat čerstvé `now` (např. každou sekundu).
private struct RBReservationLiveModel {
  let isReview: Bool
  let isCancelled: Bool
  let isActive: Bool
  let isUpcoming: Bool
  let countdownTarget: Date?

  init(state: RBReservationAttributes.ContentState, now: Date) {
    let startDate = rbParseISODate(state.startAt)
    let endDate = rbParseISODate(state.endAt)
    let subtitleLc = state.subtitle.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    isReview = subtitleLc.contains("ohodno") || subtitleLc.contains("hodnoc")
    isCancelled =
      subtitleLc.contains("zruš") || subtitleLc.contains("zrus") || subtitleLc.contains("cancel")
    isActive =
      !isReview &&
      !isCancelled &&
      startDate != nil &&
      endDate != nil &&
      now >= startDate! &&
      now < endDate!
    if let s = startDate {
      isUpcoming = !isReview && !isCancelled && !isActive && now < s
    } else {
      isUpcoming = false
    }
    if let s = startDate, now < s {
      countdownTarget = s
    } else {
      countdownTarget = endDate
    }
  }
}

/// Minuty do cíle od **začátku aktuální kalendářní minuty** (`now`), pak `ceil` po minutách.
/// Shodné s JS `rbLiveActivityMinutesDisplayed`: 19:27:xx → 19:30 = 3, ne 2 kvůli uběhlým sekundám v minutě.
private func rbMinutesRemainingCeil(target: Date, now: Date) -> Int {
  let cal = Calendar.current
  guard target > now else { return 0 }
  let parts = cal.dateComponents([.year, .month, .day, .hour, .minute], from: now)
  guard let startOfCurrentMinute = cal.date(from: parts) else { return 0 }
  let diff = target.timeIntervalSince(startOfCurrentMinute)
  if !diff.isFinite { return 0 }
  return max(0, Int(ceil(diff / 60)))
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

/// Načte logo z asset katalogu, případně z `rbLogo.png` v bundle extension (stejný soubor jako `assets/icon.png`).
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

private struct RBBrandLogo: View {
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

/// Upcoming vpravo: logo + avatar přes sebe (avatar navrch).
private struct RBUpcomingBrandLogoCluster: View {
  let avatarFilePath: String?
  var logoSize: CGFloat = 52
  var avatarSize: CGFloat = 34

  /// Overlay nemění layout loga — stejná pozice jako samotné `RBBrandLogo`; posun je jen u avatara.
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

private struct RBUpcomingBranchEmployeeRow: View {
  let state: RBReservationAttributes.ContentState
  var compact: Bool = false

  var body: some View {
    let branch = rbTrim(state.branchName)
    let emp = rbTrim(state.employeeName)
    HStack(spacing: 0) {
      if !branch.isEmpty {
        Text(branch)
      }
      if !branch.isEmpty && !emp.isEmpty {
        Text(" · ")
          .foregroundStyle(.tertiary)
      }
      if !emp.isEmpty {
        Text(emp)
      }
      Spacer(minLength: 0)
    }
    .font(compact ? .caption2 : .footnote)
    .foregroundStyle(.secondary)
    .lineLimit(1)
    .minimumScaleFactor(0.78)
  }
}

/// Čas začátek–konec (`detailLine`) v pill.
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

/// Cena — odlišný od pillu času (zaoblený obdélník + jemný okraj).
private struct RBPriceBag: View {
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

private struct RBPulsingDot: View {
  let color: Color
  var size: CGFloat = 10
  var duration: Double = 1.6

  var body: some View {
    // Prefer system symbol effects on iOS 17+ (better chance to animate in Live Activities).
    // Fallback to a static "glow" dot for iOS 16.x.
    let dot = Image(systemName: "circle.fill")
      .font(.system(size: size, weight: .bold))
      .foregroundStyle(color)
      .shadow(color: color.opacity(0.85), radius: size * 0.65, x: 0, y: 0)
      .shadow(color: color.opacity(0.45), radius: size * 1.25, x: 0, y: 0)
      .accessibilityHidden(true)

    if #available(iOS 17.0, *) {
      dot
        .symbolEffect(.pulse, options: .repeating)
    } else {
      dot
    }
  }
}

private struct RBLiveActivityProgressBar: View {
  var progress01: Double
  var accentHex: String
  /// Když je nastavené, progress bude kratší než dostupná šířka.
  var maxWidth: CGFloat? = nil

  var body: some View {
    let p = min(1, max(0, progress01))
    let fill = rbProgressFillColor(accentHex: accentHex)
    // TEMP: výrazné hodnoty pro snadné ověření, že se UI rebuildnulo.
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

private struct RBLiveActivityCard: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      RBLiveActivityCardContent(state: state, now: timeline.date)
    }
  }
}

private struct RBLiveActivityCardContent: View {
  let state: RBReservationAttributes.ContentState
  let now: Date

  var body: some View {
    let m = RBReservationLiveModel(state: state, now: now)
    let priceStr = rbTrim(state.priceFormatted ?? "")
    let detailTrimmed = rbTrim(state.detailLine)

    ZStack(alignment: .trailing) {
      VStack(alignment: .leading, spacing: 8) {
        VStack(alignment: .leading, spacing: 8) {
          if m.isActive {
            HStack(spacing: 10) {
              RBEmployeeAvatarView(filePath: state.employeeAvatarFilePath, size: 32)
              VStack(alignment: .leading, spacing: 2) {
                if !state.employeeName.isEmpty {
                  Text(state.employeeName)
                    .font(.headline)
                    .fontWeight(.bold)
                }
                HStack(spacing: 8) {
                  RBPulsingDot(
                    color: Color(red: 0.43, green: 0.87, blue: 0.37),
                    size: 16,
                    duration: 1.6
                  )
                  Text("Probíhá")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }
                if !priceStr.isEmpty {
                  RBPriceBag(text: priceStr, compact: false)
                    .padding(.top, 4)
                }
              }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          } else {
            if !state.subtitle.isEmpty {
              Text(m.isUpcoming ? "✨ \(state.subtitle)" : state.subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }

            if m.isReview {
              Text(state.title)
                .font(.title2)
                .fontWeight(.bold)
              HStack(spacing: 8) {
                ForEach(0..<5, id: \.self) { _ in
                  Image(systemName: "star")
                    .font(.title3)
                    .foregroundStyle(Color.white.opacity(0.65))
                }
              }
              .padding(.top, 2)
            } else if m.isCancelled {
              HStack(alignment: .center, spacing: 10) {
                Text(state.title)
                  .font(.title2)
                  .fontWeight(.bold)
                RBPulsingDot(color: Color.red, size: 20, duration: 1.6)
              }
            } else if let target = m.countdownTarget {
              // Pozn.: ActivityKit timer formát řídí systém (typicky MM:SS / HH:MM:SS).
              // Nejde spolehlivě vynutit "jen minuty" bez vlastních update pushů.
              Text(target, style: .timer)
                .font(.title2)
                .fontWeight(.bold)
                .monospacedDigit()
            } else {
              Text(state.title)
                .font(.title2)
                .fontWeight(.bold)
            }
          }
        }

        if !m.isReview, !m.isCancelled, !m.isActive, state.progress01 >= 0 {
          RBLiveActivityProgressBar(
            progress01: state.progress01,
            accentHex: state.accentHex ?? "",
            maxWidth: 240
          )
        }
        if m.isUpcoming {
          RBUpcomingBranchEmployeeRow(state: state, compact: false)
          if !detailTrimmed.isEmpty {
            RBTimeRangePill(text: detailTrimmed, compact: false)
          }
        } else if !m.isReview, !m.isCancelled, !m.isActive, !state.branchName.isEmpty {
          Text(state.branchName)
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        if !m.isReview, !m.isCancelled, !m.isActive, !m.isUpcoming, !state.detailLine.isEmpty {
          Text(state.detailLine)
            .font(.caption)
            .foregroundStyle(.tertiary)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .frame(minHeight: m.isActive ? 128 : nil, alignment: .topLeading)
      // Reserve space so the logo never overlaps content.
      .padding(.trailing, 62)

      // Keep logo vertically centered relative to the whole card content (not just the top row).
      VStack {
        Spacer(minLength: 0)
        if m.isUpcoming {
          RBUpcomingBrandLogoCluster(avatarFilePath: state.employeeAvatarFilePath, logoSize: 52, avatarSize: 34)
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

// MARK: - Dynamic Island (TimelineView: stejný důvod jako u lock screen karty)

private struct RBLiveActivityIslandExpandedLeading: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let m = RBReservationLiveModel(state: state, now: timeline.date)
      VStack(alignment: .leading, spacing: 4) {
        if !state.subtitle.isEmpty {
          Text(m.isUpcoming ? "✨ \(state.subtitle)" : state.subtitle)
            .font(.caption)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
        if m.isReview {
          Text(state.title)
            .font(.headline)
            .fontWeight(.bold)
        } else if m.isCancelled {
          HStack(spacing: 8) {
            Text(state.title)
              .font(.headline)
              .fontWeight(.bold)
            RBPulsingDot(color: Color.red, size: 16, duration: 1.6)
          }
        } else if m.isActive {
          HStack(spacing: 8) {
            RBPulsingDot(
              color: Color(red: 0.43, green: 0.87, blue: 0.37),
              size: 16,
              duration: 1.6
            )
            Text("Probíhá")
              .font(.headline)
              .fontWeight(.bold)
          }
        } else if let target = m.countdownTarget {
          Text(target, style: .timer)
            .font(.title3)
            .fontWeight(.bold)
            .monospacedDigit()
        } else {
          Text(state.title)
            .font(.title3)
            .fontWeight(.bold)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

private struct RBLiveActivityIslandExpandedTrailing: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let m = RBReservationLiveModel(state: state, now: timeline.date)
      if m.isUpcoming {
        RBUpcomingBrandLogoCluster(
          avatarFilePath: state.employeeAvatarFilePath,
          logoSize: 44,
          avatarSize: 28
        )
      } else {
        RBBrandLogo(size: 44)
      }
    }
  }
}

private struct RBLiveActivityIslandExpandedBottom: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let m = RBReservationLiveModel(state: state, now: timeline.date)
      let priceStr = rbTrim(state.priceFormatted ?? "")
      let detailTrimmed = rbTrim(state.detailLine)
      VStack(alignment: .leading, spacing: 6) {
        if m.isActive {
          if !priceStr.isEmpty {
            RBPriceBag(text: priceStr, compact: true)
          }
        } else if state.progress01 >= 0 {
          RBLiveActivityProgressBar(
            progress01: state.progress01,
            accentHex: state.accentHex ?? "",
            maxWidth: 200
          )
        }
        if m.isUpcoming {
          RBUpcomingBranchEmployeeRow(state: state, compact: true)
          if !detailTrimmed.isEmpty {
            RBTimeRangePill(text: detailTrimmed, compact: true)
          }
        } else if !state.branchName.isEmpty {
          Text(state.branchName)
            .font(.caption)
            .foregroundStyle(.secondary)
        }
        if !m.isUpcoming, !state.detailLine.isEmpty {
          Text(state.detailLine)
            .font(.caption2)
            .foregroundStyle(.tertiary)
        }
      }
    }
  }
}

private struct RBLiveActivityIslandCompactTrailing: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    TimelineView(.periodic(from: .now, by: 1)) { timeline in
      let m = RBReservationLiveModel(state: state, now: timeline.date)
      if m.isCancelled {
        RBPulsingDot(color: Color.red, size: 20, duration: 1.6)
      } else if m.isReview {
        Image(systemName: "star")
          .font(.system(size: 16, weight: .bold))
          .foregroundStyle(Color.white.opacity(0.8))
      } else if m.isActive {
        RBPulsingDot(
          color: Color(red: 0.43, green: 0.87, blue: 0.37),
          size: 20,
          duration: 1.6
        )
      } else if let target = m.countdownTarget {
        let mins = rbMinutesRemainingCeil(target: target, now: timeline.date)
        Text(m.isUpcoming ? "✨ \(mins) min" : "\(mins) min")
          .font(.system(size: 12, weight: .bold, design: .rounded))
          .monospacedDigit()
      } else {
        RBBrandLogo(size: 30)
      }
    }
  }
}

struct RealBarberLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: RBReservationAttributes.self) { context in
      RBLiveActivityCard(state: context.state)
        .activityBackgroundTint(Color.black)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          RBLiveActivityIslandExpandedLeading(state: context.state)
        }
        DynamicIslandExpandedRegion(.trailing) {
          RBLiveActivityIslandExpandedTrailing(state: context.state)
        }
        DynamicIslandExpandedRegion(.bottom) {
          RBLiveActivityIslandExpandedBottom(state: context.state)
        }
      } compactLeading: {
        RBBrandLogo(size: 30)
      } compactTrailing: {
        RBLiveActivityIslandCompactTrailing(state: context.state)
      } minimal: {
        RBBrandLogo(size: 24)
      }
    }
  }
}
