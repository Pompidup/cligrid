import type { EasingFn } from "../utils/easing.js";
import { linear } from "../utils/easing.js";

type AnimationId = number;

type AnimationConfig = {
  from: number;
  to: number;
  duration: number;
  easing?: EasingFn;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
};

type ActiveAnimation = {
  config: AnimationConfig;
  startTime: number;
};

class Animator {
  private animations: Map<AnimationId, ActiveAnimation> = new Map();
  private nextId = 1;
  private interval: ReturnType<typeof setInterval> | null = null;
  private tickCallbacks: Set<(dt: number) => void> = new Set();
  private lastTickTime = 0;
  private onFrameCallback: (() => void) | null = null;
  private readonly FRAME_MS = 33; // ~30fps

  animate(config: AnimationConfig): AnimationId {
    const id = this.nextId++;
    this.animations.set(id, {
      config,
      startTime: Date.now(),
    });
    this.ensureRunning();
    return id;
  }

  cancel(id: AnimationId): void {
    this.animations.delete(id);
    this.stopIfIdle();
  }

  onTick(callback: (dt: number) => void): () => void {
    this.tickCallbacks.add(callback);
    this.ensureRunning();
    return () => {
      this.tickCallbacks.delete(callback);
      this.stopIfIdle();
    };
  }

  onFrame(callback: () => void): void {
    this.onFrameCallback = callback;
  }

  destroy(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.animations.clear();
    this.tickCallbacks.clear();
    this.onFrameCallback = null;
  }

  private ensureRunning(): void {
    if (this.interval !== null) return;
    this.lastTickTime = Date.now();
    this.interval = setInterval(() => this.tick(), this.FRAME_MS);
  }

  private stopIfIdle(): void {
    if (this.animations.size === 0 && this.tickCallbacks.size === 0) {
      if (this.interval !== null) {
        clearInterval(this.interval);
        this.interval = null;
      }
    }
  }

  private tick(): void {
    const now = Date.now();
    const dt = now - this.lastTickTime;
    this.lastTickTime = now;

    let hadUpdates = false;

    // Process animations
    const completed: AnimationId[] = [];
    for (const [id, anim] of this.animations) {
      const elapsed = now - anim.startTime;
      const { from, to, duration, easing = linear, onUpdate, onComplete } = anim.config;

      if (elapsed >= duration) {
        onUpdate(to);
        completed.push(id);
        if (onComplete) onComplete();
      } else {
        const progress = easing(elapsed / duration);
        onUpdate(from + (to - from) * progress);
      }
      hadUpdates = true;
    }

    for (const id of completed) {
      this.animations.delete(id);
    }

    // Call tick callbacks
    for (const cb of this.tickCallbacks) {
      cb(dt);
      hadUpdates = true;
    }

    // Notify frame listener for render batching
    if (hadUpdates && this.onFrameCallback) {
      this.onFrameCallback();
    }

    this.stopIfIdle();
  }
}

export { Animator };
export type { AnimationId, AnimationConfig };
