import { Step } from '../types';

export class PlayerEngine {
  private steps: Step[] = [];
  private stepIndex = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private onStepChange: ((step: Step, index: number, data: number[]) => void) | null = null;
  private onComplete: (() => void) | null = null;
  private currentData: number[] = [];
  private _speed = 1500;

  setSpeed(speed: number) { this._speed = speed; }

  load(steps: Step[], onStepChange: (step: Step, index: number, data: number[]) => void, onComplete: () => void, initialData?: number[]) {
    this.stop();
    this.steps = steps;
    this.stepIndex = 0;
    if (initialData) {
      this.currentData = [...initialData];
    }
    this.onStepChange = onStepChange;
    this.onComplete = onComplete;
    if (steps.length > 0) {
      this.emitCurrent();
    }
  }

  play() {
    if (this.timerId) return;
    const engine = this;
    const tick = () => {
      if (engine.stepIndex >= engine.steps.length) {
        engine.stop();
        engine.onComplete?.();
        return;
      }
      engine.emitCurrent();
      engine.stepIndex++;
      engine.timerId = setTimeout(tick, engine._speed);
    };
    tick();
  }

  pause() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  stop() {
    this.pause();
    this.stepIndex = 0;
    this.currentData = [];
  }

  stepForward() {
    if (this.stepIndex >= this.steps.length) return;
    this.emitCurrent();
    this.stepIndex++;
  }

  stepBackward() {
    // Rebuild data from beginning up to stepIndex-1
    if (this.stepIndex <= 0) return;
    this.stepIndex--;
    // Rebuild data from step 0 to stepIndex
    this.currentData = [...this.currentData];
    const targetIdx = this.stepIndex;
    this.currentData = [];
    for (let i = 0; i <= targetIdx; i++) {
      const s = this.steps[i];
      if (s.type === 'swap' && this.currentData.length > 0) {
        const { i: a, j: b } = s.data;
        if (a < this.currentData.length && b < this.currentData.length) {
          const tmp = this.currentData[a];
          this.currentData[a] = this.currentData[b];
          this.currentData[b] = tmp;
        }
      } else if (s.type === 'setValue' && this.currentData.length > 0) {
        const idx = s.data.index;
        if (idx < this.currentData.length) this.currentData[idx] = s.data.value;
      }
    }
    this.emitCurrentAt(this.stepIndex);
  }

  getStepIndex() { return this.stepIndex; }
  getStepCount() { return this.steps.length; }
  isPlaying() { return this.timerId !== null; }

  setInitialData(data: number[]) {
    this.currentData = [...data];
  }

  private emitCurrent() {
    this.emitCurrentAt(this.stepIndex);
  }

  private emitCurrentAt(index: number) {
    if (index < 0 || index >= this.steps.length) return;
    const step = this.steps[index];
    if (!step || !this.onStepChange) return;

    if (step.type === 'swap') {
      const { i, j } = step.data;
      if (i < this.currentData.length && j < this.currentData.length) {
        const tmp = this.currentData[i];
        this.currentData[i] = this.currentData[j];
        this.currentData[j] = tmp;
      }
    } else if (step.type === 'setValue') {
      const idx = step.data.index;
      if (idx < this.currentData.length) this.currentData[idx] = step.data.value;
    } else if (step.type === 'setRange') {
      // Reset discarded state is handled by hook
    }

    this.onStepChange(step, index, [...this.currentData]);
  }
}

export const playerEngine = new PlayerEngine();