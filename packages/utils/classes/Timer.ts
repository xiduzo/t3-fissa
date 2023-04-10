// Will start time whenever class is instantiated
// Time will be rounded to the nearest millisecond
export class Timer {
  private _startedAt: number;
  private _name: string;

  constructor(name = "Unknown timer") {
    this._startedAt = performance.now();
    this._name = name;
    console.info(`[TIMER] ${this._name}`);
  }

  duration() {
    const duration = Math.round(performance.now() - this._startedAt);

    console.info(`[DURATION] ${this._name} - ${duration}ms`);
    return duration;
  }
}
