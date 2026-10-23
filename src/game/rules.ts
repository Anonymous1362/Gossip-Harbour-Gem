import { LevelConfig } from './types';

export interface EvaluationResult {
  isWin: boolean;
  stars: number;
  coinPercentage: number;
  coinsInJar: number;
  coinsSpilled: number;
  totalCoins: number;
}

/**
 * Calculates the stars earned based on level thresholds, coins collected, and spills.
 */
export function calculateStars(
  level: LevelConfig,
  coinsInJar: number,
  coinsSpilled: number,
  totalCoins: number
): number {
  if (totalCoins <= 0) return 0;
  const percent = (coinsInJar / totalCoins) * 100;
  const th = level.starThresholds;

  if (percent >= th.threeStars.minCoinPercent && coinsSpilled <= th.threeStars.maxSpills) {
    return 3;
  }
  if (percent >= th.twoStars.minCoinPercent) {
    return 2;
  }
  if (percent >= th.oneStar.minCoinPercent) {
    return 1;
  }
  return 0;
}

/**
 * Evaluates the game end condition.
 */
export function evaluateLevelState(
  level: LevelConfig,
  coinsInJar: number,
  coinsSpilled: number,
  totalCoins: number,
  flowSettled: boolean
): EvaluationResult {
  const stars = calculateStars(level, coinsInJar, coinsSpilled, totalCoins);
  const coinPercentage = totalCoins > 0 ? (coinsInJar / totalCoins) * 100 : 0;
  const isWin = flowSettled && coinPercentage >= level.starThresholds.oneStar.minCoinPercent;

  return {
    isWin,
    stars,
    coinPercentage,
    coinsInJar,
    coinsSpilled,
    totalCoins,
  };
}

/**
 * Validates level integrity: checks for valid exit, positive coin count, and proper rod endpoints.
 */
export function validateLevelConfig(level: LevelConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (level.coinCount <= 0) {
    errors.push(`Level ${level.id} must have coinCount > 0`);
  }
  if (level.exitWidth <= 0) {
    errors.push(`Level ${level.id} exitWidth must be > 0`);
  }
  if (!level.rods || level.rods.length === 0) {
    errors.push(`Level ${level.id} has no rods`);
  }
  for (const rod of level.rods) {
    const dx = rod.x2 - rod.x1;
    const dy = rod.y2 - rod.y1;
    const len = Math.hypot(dx, dy);
    if (len < 10) {
      errors.push(`Rod ${rod.id} length is too short: ${len}`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
