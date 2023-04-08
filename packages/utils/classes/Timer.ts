// Will start time whenever class is instantiated
export class Timer {
  private _startedAt: number;
  private _name: string;

  constructor(name = "Unknown timer") {
    this._startedAt = performance.now();
    this._name = name;
  }

  duration() {
    return `${this._name} ran for ${performance.now() - this._startedAt}ms`;
  }
}
