// Will start whenever class is instantiated
// But can be overridden with the `start()` method
export class Timer {
  private _startedAt: number;
  private _name: string;

  constructor(name = "Unknown timer") {
    this._startedAt = performance.now();
    this._name = name;
  }

  start() {
    this._startedAt = performance.now();
  }

  duration() {
    return `${this._name} ran for ${performance.now() - this._startedAt}ms`;
  }
}
