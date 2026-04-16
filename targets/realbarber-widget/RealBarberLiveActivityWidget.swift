import ActivityKit
import SwiftUI
import WidgetKit

struct RealBarberLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: RBReservationAttributes.self) { context in
      RBReservationLiveActivityCard(
        state: context.state,
        deepLink: context.attributes.deepLink
      )
      .activityBackgroundTint(Color.black)
      .widgetURL(URL(string: context.attributes.deepLink))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          RBReservationLiveActivityIslandExpandedLeadingView(state: context.state)
        }
        DynamicIslandExpandedRegion(.trailing) {
          RBReservationLiveActivityIslandExpandedTrailingView(state: context.state)
        }
        DynamicIslandExpandedRegion(.bottom) {
          RBReservationLiveActivityIslandExpandedBottomView(state: context.state)
        }
      } compactLeading: {
        RBBrandLogo(size: 24)
      } compactTrailing: {
        RBReservationLiveActivityIslandCompactTrailingView(state: context.state)
      } minimal: {
        RBReservationLiveActivityIslandMinimalView(state: context.state)
      }
      .widgetURL(URL(string: context.attributes.deepLink))
    }
  }
}
