export class NotTheHost extends Error {
  public constructor(message = "You are not the host") {
    super(message);
    this.name = NotTheHost.name;
  }
}

export class NoNextTrack extends Error {
  public constructor(message = "No next track") {
    super(message);
    this.name = NoNextTrack.name;
  }
}
