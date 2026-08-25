import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct RealBarberBookingWidget: Widget {
  let name: String = "RealBarberBookingWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Real Barber")
    .description("Nejbližší rezervace a rychlý přehled z Real Barber.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
  }
}