import { BackHandler } from 'react-native';

// A utility to safely manage back button handlers and ensure they're properly cleaned up
class BackHandlerManager {
  private static instance: BackHandlerManager;
  private handlers: Map<string, () => boolean> = new Map();
  private activeHandlerId: string | null = null;
  private backHandlerSubscription: any = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): BackHandlerManager {
    if (!BackHandlerManager.instance) {
      BackHandlerManager.instance = new BackHandlerManager();
    }
    return BackHandlerManager.instance;
  }

  // Register a new back handler with a unique ID
  public registerHandler(id: string, handler: () => boolean): () => void {
    this.handlers.set(id, handler);

    if (!this.activeHandlerId) {
      this.setActiveHandler(id);
    }

    return () => this.unregisterHandler(id);
  }

  // Set a specific handler as the active one
  public setActiveHandler(id: string): void {
    if (!this.handlers.has(id)) {
      return;
    }

    this.removeCurrentSubscription();
    this.activeHandlerId = id;

    this.backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      this.mainHandler
    );
  }

  // Unregister a handler by ID
  public unregisterHandler(id: string): void {
    if (!this.handlers.has(id)) {
      return;
    }

    if (this.activeHandlerId === id) {
      this.removeCurrentSubscription();
      this.activeHandlerId = null;

      if (this.handlers.size > 1) {
        const nextId = Array.from(this.handlers.keys()).find((key) => key !== id);
        if (nextId) {
          this.setActiveHandler(nextId);
        }
      }
    }

    this.handlers.delete(id);
  }

  // Reset all handlers (useful for cleanup)
  public resetAll(): void {
    this.removeCurrentSubscription();
    this.handlers.clear();
    this.activeHandlerId = null;
  }

  private removeCurrentSubscription(): void {
    if (this.backHandlerSubscription) {
      this.backHandlerSubscription.remove();
      this.backHandlerSubscription = null;
    }
  }

  private mainHandler = (): boolean => {
    if (this.activeHandlerId && this.handlers.has(this.activeHandlerId)) {
      return this.handlers.get(this.activeHandlerId)!();
    }
    return false;
  };
}

export default BackHandlerManager;
