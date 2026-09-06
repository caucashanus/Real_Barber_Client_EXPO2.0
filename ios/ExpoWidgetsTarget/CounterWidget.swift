import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CounterWidget: Widget {
  let name: String = "CounterWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Counter Widget")
    .description("A sample counter home screen widget")
    .supportedFamilies([.systemSmall, .systemMedium])
    .contentMarginsDisabled()
  }
}