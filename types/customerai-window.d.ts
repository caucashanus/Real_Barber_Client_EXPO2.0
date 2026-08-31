export {};

declare global {
  interface Window {
    customerai?: ((...args: unknown[]) => void) & {
      q?: unknown[];
    };
  }
}
