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

private func rbMinutesRemainingCeil(target: Date, now: Date) -> Int {
  let diff = target.timeIntervalSince(now)
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
    let startDate = rbParseISODate(state.startAt)
    let endDate = rbParseISODate(state.endAt)
    let now = Date()
    let countdownTarget = (startDate != nil && now < startDate!) ? startDate : endDate
    let subtitleLc = state.subtitle.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    let isReview = subtitleLc.contains("ohodno") || subtitleLc.contains("hodnoc")
    let isCancelled =
      subtitleLc.contains("zruš") || subtitleLc.contains("zrus") || subtitleLc.contains("cancel")
    let isActive =
      !isReview &&
      !isCancelled &&
      startDate != nil &&
      endDate != nil &&
      now >= startDate! &&
      now < endDate!

    ZStack(alignment: .trailing) {
      VStack(alignment: .leading, spacing: 8) {
        VStack(alignment: .leading, spacing: 8) {
          if isActive {
            HStack(spacing: 10) {
              if let url = URL(string: state.employeeAvatarUrl ?? ""), !url.absoluteString.isEmpty {
                AsyncImage(url: url) { phase in
                  switch phase {
                  case .success(let img):
                    img.resizable().scaledToFill()
                  default:
                    Color.white.opacity(0.08)
                  }
                }
                .frame(width: 32, height: 32)
                .clipShape(Circle())
              }
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
              }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
          } else {
            if !state.subtitle.isEmpty {
              Text(state.subtitle)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }

            if isReview {
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
            } else if isCancelled {
              HStack(alignment: .center, spacing: 10) {
                Text(state.title)
                  .font(.title2)
                  .fontWeight(.bold)
                RBPulsingDot(color: Color.red, size: 20, duration: 1.6)
              }
            } else if let target = countdownTarget {
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

        if !isReview, !isCancelled, !isActive, state.progress01 >= 0 {
          RBLiveActivityProgressBar(
            progress01: state.progress01,
            accentHex: state.accentHex ?? "",
            maxWidth: 240
          )
        }
        if !isReview, !isCancelled, !isActive, !state.branchName.isEmpty {
          Text(state.branchName)
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
        if !isReview, !isCancelled, !isActive, !state.detailLine.isEmpty {
          Text(state.detailLine)
            .font(.caption)
            .foregroundStyle(.tertiary)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .frame(minHeight: isActive ? 128 : nil, alignment: .topLeading)
      // Reserve space so the logo never overlaps content.
      .padding(.trailing, 62)

      // Keep logo vertically centered relative to the whole card content (not just the top row).
      VStack {
        Spacer(minLength: 0)
        RBBrandLogo(size: 52)
        Spacer(minLength: 0)
      }
      .frame(width: 52)
    }
    .padding()
  }
}

struct RealBarberLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: RBReservationAttributes.self) { context in
      RBLiveActivityCard(state: context.state)
        .activityBackgroundTint(Color.black)
    } dynamicIsland: { context in
      let startDate = rbParseISODate(context.state.startAt)
      let endDate = rbParseISODate(context.state.endAt)
      let now = Date()
      let countdownTarget = (startDate != nil && now < startDate!) ? startDate : endDate
      let subtitleLc = context.state.subtitle.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      let isReview = subtitleLc.contains("ohodno") || subtitleLc.contains("hodnoc")
      let isCancelled =
        subtitleLc.contains("zruš") || subtitleLc.contains("zrus") || subtitleLc.contains("cancel")
      let isActive =
        !isReview &&
        !isCancelled &&
        startDate != nil &&
        endDate != nil &&
        now >= startDate! &&
        now < endDate!

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 4) {
            if !context.state.subtitle.isEmpty {
              Text(context.state.subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            if isReview {
              Text(context.state.title)
                .font(.headline)
                .fontWeight(.bold)
            } else if isCancelled {
              HStack(spacing: 8) {
                Text(context.state.title)
                  .font(.headline)
                  .fontWeight(.bold)
                RBPulsingDot(color: Color.red, size: 16, duration: 1.6)
              }
            } else if isActive {
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
            } else if let target = countdownTarget {
              Text(target, style: .timer)
                .font(.title3)
                .fontWeight(.bold)
                .monospacedDigit()
            } else {
              Text(context.state.title)
                .font(.title3)
                .fontWeight(.bold)
            }
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          RBBrandLogo(size: 44)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 6) {
            if isActive {
              EmptyView()
            } else if context.state.progress01 >= 0 {
              RBLiveActivityProgressBar(
                progress01: context.state.progress01,
                accentHex: context.state.accentHex ?? "",
                maxWidth: 200
              )
            }
            if !context.state.branchName.isEmpty {
              Text(context.state.branchName)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            if !context.state.detailLine.isEmpty {
              Text(context.state.detailLine)
                .font(.caption2)
                .foregroundStyle(.tertiary)
            }
          }
        }
      } compactLeading: {
        RBBrandLogo(size: 30)
      } compactTrailing: {
        if isCancelled {
          RBPulsingDot(color: Color.red, size: 20, duration: 1.6)
        } else if isReview {
          Image(systemName: "star")
            .font(.system(size: 16, weight: .bold))
            .foregroundStyle(Color.white.opacity(0.8))
        } else if isActive {
          RBPulsingDot(
            color: Color(red: 0.43, green: 0.87, blue: 0.37),
            size: 20,
            duration: 1.6
          )
        } else if let target = countdownTarget {
          let m = rbMinutesRemainingCeil(target: target, now: now)
          Text("\(m) min")
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .monospacedDigit()
        } else {
          RBBrandLogo(size: 30)
        }
      } minimal: {
        RBBrandLogo(size: 24)
      }
    }
  }
}
