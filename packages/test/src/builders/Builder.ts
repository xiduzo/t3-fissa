export abstract class Builder<T> {
  protected _data: T;

  constructor(data: T) {
    this._data = data;
  }

  public build(): T {
    return this._data;
  }
}
