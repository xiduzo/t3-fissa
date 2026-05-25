import { describe, expect, it } from "vitest";

import { InsufficientPoints, Wallet } from "./Wallet";

describe("Wallet", () => {
  const wallet = (balance: number) => Wallet.load("AB12", "user-1", balance);

  describe("spend (transactional, floor-guarded)", () => {
    it("deducts when the balance covers it", () => {
      const w = wallet(50);
      w.spend(30);
      expect(w.balance).toBe(20);
    });

    it("allows spending the entire balance to exactly zero", () => {
      const w = wallet(50);
      w.spend(50);
      expect(w.balance).toBe(0);
    });

    it("refuses to go below zero and leaves the balance untouched", () => {
      const w = wallet(10);
      expect(() => w.spend(11)).toThrow(InsufficientPoints);
      expect(w.balance).toBe(10);
    });

    it("rejects non-positive amounts", () => {
      const w = wallet(50);
      expect(() => w.spend(0)).toThrow(RangeError);
      expect(() => w.spend(-5)).toThrow(RangeError);
    });
  });

  describe("credit (eventual, additive)", () => {
    it("adds earned points", () => {
      const w = wallet(50);
      w.credit(7);
      expect(w.balance).toBe(57);
    });

    it("permits a penalty to carry the balance negative (floor is spend-only)", () => {
      const w = wallet(3);
      w.credit(-5);
      expect(w.balance).toBe(-2);
    });
  });
});
