import { CombatNumbersV01, type EconomyState } from "@sprout-and-steel/shared";

export class EconomySystem {
  private sharedSun: number;
  private totalSunEarned = 0;
  private totalSunSpent = 0;
  private sunSuppressed = false;
  private sunSuppressionRemainingSeconds: number | undefined;

  constructor(initialSharedSun: number = CombatNumbersV01.economy.initialSharedSun) {
    this.sharedSun = Math.max(0, Math.floor(initialSharedSun));
  }

  getSnapshot(): EconomyState {
    const snapshot: EconomyState = {
      sharedSun: this.sharedSun,
      totalSunEarned: this.totalSunEarned,
      totalSunSpent: this.totalSunSpent,
      sunSuppressed: this.sunSuppressed
    };

    if (this.sunSuppressionRemainingSeconds !== undefined) {
      snapshot.sunSuppressionRemainingSeconds = Number(this.sunSuppressionRemainingSeconds.toFixed(3));
    }

    return snapshot;
  }

  update(deltaSeconds: number): void {
    if (!this.sunSuppressed || this.sunSuppressionRemainingSeconds === undefined || deltaSeconds <= 0) {
      return;
    }

    const remaining = this.sunSuppressionRemainingSeconds - deltaSeconds;
    if (remaining > 0) {
      this.sunSuppressionRemainingSeconds = remaining;
      return;
    }

    this.sunSuppressed = false;
    this.sunSuppressionRemainingSeconds = undefined;
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

  suppressSun(durationSeconds: number): void {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return;
    }

    this.sunSuppressed = true;
    this.sunSuppressionRemainingSeconds = durationSeconds;
  }
}
