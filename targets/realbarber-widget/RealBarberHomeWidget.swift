import SwiftUI
import WidgetKit

private let kAppGroup = "group.com.realbarber.client"
private let kTitleKey = "rb_widget_title"
private let kSubtitleKey = "rb_widget_subtitle"

struct HomeWidgetEntry: TimelineEntry {
  let date: Date
  let title: String
  let subtitle: String
}

struct HomeWidgetProvider: TimelineProvider {
  func placeholder(in context: Context) -> HomeWidgetEntry {
    HomeWidgetEntry(date: Date(), title: "Real Barber", subtitle: "")
  }

  func getSnapshot(in context: Context, completion: @escaping (HomeWidgetEntry) -> Void) {
    completion(readEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<HomeWidgetEntry>) -> Void) {
    let entry = readEntry()
    let next = Date().addingTimeInterval(15 * 60)
    completion(Timeline(entries: [entry], policy: .after(next)))
  }

  private func readEntry() -> HomeWidgetEntry {
    let d = UserDefaults(suiteName: kAppGroup)
    let title = d?.string(forKey: kTitleKey) ?? "Real Barber"
    let subtitle = d?.string(forKey: kSubtitleKey) ?? ""
    return HomeWidgetEntry(date: Date(), title: title, subtitle: subtitle)
  }
}

struct RealBarberHomeWidgetView: View {
  var entry: HomeWidgetProvider.Entry

  var body: some View {
    VStack(alignment: .leading, spacing: 4) {
      Text(entry.title)
        .font(.headline)
      if !entry.subtitle.isEmpty {
        Text(entry.subtitle)
          .font(.caption)
          .foregroundStyle(.secondary)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .padding()
  }
}

struct RealBarberHomeWidget: Widget {
  let kind = "RealBarberHomeWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: HomeWidgetProvider()) { entry in
      RealBarberHomeWidgetView(entry: entry)
    }
    .configurationDisplayName("Real Barber")
    .description("Rychlý přehled z aplikace Real Barber.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
  }
}
