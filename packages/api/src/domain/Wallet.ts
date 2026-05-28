/**
 * Wallet aggregate — a guest's spendable points balance within one Fissa,
 * rooted at `(pin, userId)`. It owns the one invariant the points economy has:
 * a balance may not go below zero on an explicit spend.
 *
 * Earning is eventual: `credit` is applied by the outbox drainer folding
 * `PointsAwarded` events, and may be negative (a skip penalty). Spending is
 * transactional: `spend` enforces the floor against committed state. See
 * ADR-0001.
 */

export class InsufficientPoints extends Error {
  constructor(
    readonly pin: string,
    readonly userId: string,
    readonly balance: number,
    readonly requested: number,
  ) {
    super(
      `Wallet ${userId}@${pin} has ${balance} points, cannot spend ${requested}`,
    );
    this.name = "InsufficientPoints";
  }
}

/**
 * Raised when a guest tries to act on a Wallet for a fissa they're not a
 * member of. Distinct from a member with a zero balance — that's
 * {@link InsufficientPoints}. Keeping the two errors separate stops a
 * non-member spend looking like a normal "you can't afford this" message.
 */
export class NotAMember extends Error {
  constructor(readonly pin: string, readonly userId: string) {
    super(`User ${userId} is not a member of fissa ${pin}`);
    this.name = "NotAMember";
  }
}

export class Wallet {
  private constructor(
    readonly pin: string,
    readonly userId: string,
    private _balance: number,
  ) {}

  static load(pin: string, userId: string, balance: number): Wallet {
    return new Wallet(pin, userId, balance);
  }

  get balance(): number {
    return this._balance;
  }

  /**
   * Apply an earned (or penalised) amount. Additive and unbounded — the floor
   * is only enforced on {@link spend}, so a skip penalty may carry a balance
   * negative. Eventual: called by the drainer, not on the request path.
   */
  credit(amount: number): void {
    this._balance += amount;
  }

  /**
   * Spend points. Transactional and floor-guarded: throws
   * {@link InsufficientPoints} rather than allowing a negative balance.
   */
  spend(amount: number): void {
    if (amount <= 0) {
      throw new RangeError(`spend amount must be positive, got ${amount}`);
    }
    if (this._balance - amount < 0) {
      throw new InsufficientPoints(
        this.pin,
        this.userId,
        this._balance,
        amount,
      );
    }
    this._balance -= amount;
  }
}
