export class NotTheHost extends Error {
  public constructor(message = "You are not the host") {
    super(message);
    this.name = NotTheHost.name;
  }
}

export class FissaIsPaused extends Error {
  public constructor(message = "Fissa is paused") {
    super(message);
    this.name = FissaIsPaused.name;
  }
}

export class NotAbleToAccessSpotify extends Error {
  public constructor(message = "Not able to access Spotify") {
    super(message);
    this.name = NotAbleToAccessSpotify.name;
  }
}

export class NoNextTrack extends Error {
  public constructor(message = "No next track") {
    super(message);
    this.name = NoNextTrack.name;
  }
}
