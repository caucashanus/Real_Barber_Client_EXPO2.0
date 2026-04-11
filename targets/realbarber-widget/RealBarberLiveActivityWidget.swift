import ActivityKit
import SwiftUI
import UIKit
import WidgetKit

/// Kolejnice progressu (neutrální); výplň = accent nebo černobílý fallback (bílá).
private let rbProgressTrackColor = Color.white.opacity(0.22)

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

private struct RBLiveActivityProgressBar: View {
  var progress01: Double
  var accentHex: String

  var body: some View {
    let p = min(1, max(0, progress01))
    let fill = rbProgressFillColor(accentHex: accentHex)
    GeometryReader { geo in
      let w = geo.size.width
      ZStack(alignment: .leading) {
        Capsule()
          .fill(rbProgressTrackColor)
          .frame(height: 5)
        Capsule()
          .fill(fill)
          .frame(width: max(0, w * p), height: 5)
        Circle()
          .fill(fill)
          .frame(width: 11, height: 11)
          .shadow(color: .black.opacity(0.12), radius: 1, x: 0, y: 1)
          .offset(x: max(0, w * p - 5.5))
      }
    }
    .frame(height: 12)
  }
}

private struct RBLiveActivityCard: View {
  let state: RBReservationAttributes.ContentState

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack(alignment: .top, spacing: 10) {
        VStack(alignment: .leading, spacing: 8) {
          if !state.subtitle.isEmpty {
            Text(state.subtitle)
              .font(.subheadline)
              .foregroundStyle(.secondary)
          }
          Text(state.title)
            .font(.title2)
            .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        RBBrandLogo(size: 28)
      }
      if state.progress01 >= 0 {
        RBLiveActivityProgressBar(progress01: state.progress01, accentHex: state.accentHex ?? "")
      }
      if !state.branchName.isEmpty {
        Text(state.branchName)
          .font(.footnote)
          .foregroundStyle(.secondary)
      }
      if !state.detailLine.isEmpty {
        Text(state.detailLine)
          .font(.caption)
          .foregroundStyle(.tertiary)
      }
    }
    .padding()
  }
}

struct RealBarberLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: RBReservationAttributes.self) { context in
      RBLiveActivityCard(state: context.state)
        .activityBackgroundTint(Color.black.opacity(0.55))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 4) {
            if !context.state.subtitle.isEmpty {
              Text(context.state.subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
            Text(context.state.title)
              .font(.title3)
              .fontWeight(.bold)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          RBBrandLogo(size: 26)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 6) {
            if context.state.progress01 >= 0 {
              RBLiveActivityProgressBar(
                progress01: context.state.progress01,
                accentHex: context.state.accentHex ?? ""
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
        RBBrandLogo(size: 18)
      } compactTrailing: {
        RBBrandLogo(size: 18)
      } minimal: {
        RBBrandLogo(size: 14)
      }
    }
  }
}
