// Will start time whenever class is instantiated
export class Timer {
  private _startedAt: number;
  private _name: string;

  constructor(name = "Unknown timer") {
    this._startedAt = performance.now();
    this._name = name;
    console.info(`[TIMER] ${this._name}`);
  }

  duration() {
    const duration = performance.now() - this._startedAt;

    console.info(`[DURATION] ${this._name} - ${duration}ms`);
    return duration;
  }
}
