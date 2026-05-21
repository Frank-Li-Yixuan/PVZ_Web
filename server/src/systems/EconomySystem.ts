import { CombatNumbersV01, type EconomyState } from "@sprout-and-steel/shared";

export class EconomySystem {
  private sharedSun: number;
  private totalSunEarned = 0;
  private totalSunSpent = 0;
  private sunSuppressed = false;

  constructor(initialSharedSun: number = CombatNumbersV01.economy.initialSharedSun) {
    this.sharedSun = Math.max(0, Math.floor(initialSharedSun));
  }

  getSnapshot(): EconomyState {
    return {
      sharedSun: this.sharedSun,
      totalSunEarned: this.totalSunEarned,
      totalSunSpent: this.totalSunSpent,
      sunSuppressed: this.sunSuppressed
    };
  }

  canSpend(amount: number): boolean {
    return Number.isFinite(amount) && amount >= 0 && this.sharedSun >= amount;
  }

  spend(amount: number): boolean {
    if (!this.canSpend(amount)) {
      return false;
    }

    this.sharedSun -= amount;
    this.totalSunSpent += amount;
    return true;
  }

  gain(amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    const wholeAmount = Math.floor(amount);
    this.sharedSun += wholeAmount;
    this.totalSunEarned += wholeAmount;
  }

  isSunSuppressed(): boolean {
    return this.sunSuppressed;
  }
}
