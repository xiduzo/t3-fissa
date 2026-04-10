export interface IBadgeService {
  fissaCreated(): Promise<void>;
  joinedFissa(pin: string): Promise<void>;
  tracksAdded(amount: number): Promise<void>;
  voted(vote: number, forUser?: string | null): Promise<void>;
  pointsEarned(userId: string, amount: number): Promise<void>;
}
