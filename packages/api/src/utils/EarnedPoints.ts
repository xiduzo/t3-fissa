export enum EarnedPoints {
  // A skip is mild negative feedback from the host — a small flat penalty
  // (was -20, which dwarfed the +3 play reward and dragged scores negative).
  SkipTrack = -5,
  // NB: a *played* track no longer grants a flat reward. Instead the owner is
  // credited with the track's net vote score (up minus down votes) at the
  // moment it plays — see FissaService.playTrack. This makes points merit-based:
  // tracks the crowd actually liked pay out, spam/unliked tracks pay ~nothing.
}
