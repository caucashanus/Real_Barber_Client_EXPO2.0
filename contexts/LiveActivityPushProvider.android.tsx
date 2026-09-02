import React from 'react';

/** Android — Live Activity / ActivityKit není podporováno. */
export default function LiveActivityPushProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
