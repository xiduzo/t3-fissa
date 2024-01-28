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

export class UnableToPlayTrack extends Error {
  public constructor(message = "Unable to play track") {
    super(message);
    this.name = UnableToPlayTrack.name;
  }
}

export class NotImplemented extends Error {
  public constructor(message = "Not implemented") {
    super(message);
    this.name = NotImplemented.name;
  }
}

export class ForceStopFissa extends Error {
  public constructor(message = "Forcefully stop fissa") {
    super(message);
    this.name = ForceStopFissa.name;
  }
}

export class UnableToCreateFissa extends Error {
  public constructor(message = "Unable to create fissa") {
    super(message);
    this.name = UnableToCreateFissa.name;
  }
}
