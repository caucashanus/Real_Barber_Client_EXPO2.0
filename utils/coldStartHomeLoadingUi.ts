/** Po brand cold startu schovej home spinner — data se načítají před mountem home. */

let suppressInitialHomeLoadingUi = true;

export function shouldSuppressInitialHomeLoadingUi(): boolean {
  return suppressInitialHomeLoadingUi;
}

export function markInitialHomeLoadingUiConsumed(): void {
  suppressInitialHomeLoadingUi = false;
}