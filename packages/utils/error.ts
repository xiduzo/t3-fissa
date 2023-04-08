export class NotTheHost extends Error {
  public constructor(message = 'You are not the host') {
    super(message);
    this.name = NotTheHost.name;
  }
}
