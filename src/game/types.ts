export type RodRole = 'gate' | 'support' | 'decoy';

export interface RodConfig {
  id: string;
  // Start and end coordinates in physics world units (e.g. hopper center at 0, 0)
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Direction of pull: 1 = pull towards (x2, y2), -1 = pull towards (x1, y1)
  pullDirection: 1 | -1;
  role: RodRole;
  angleDeg?: number;
  color?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  coinCount: number;
  hopperWidth: number;
  hopperHeight: number;
  exitX: number; // relative to center
  exitY: number;
  exitWidth: number;
  secondaryExit?: {
    exitX: number;
    exitY: number;
    exitWidth: number;
  };
  rods: RodConfig[];
  starThresholds: {
    threeStars: { minCoinPercent: number; maxSpills: number };
    twoStars: { minCoinPercent: number };
    oneStar: { minCoinPercent: number };
  };
  tutorialHint?: string;
}

import { NarrativeSaveState } from './narrativeTypes';

export interface GameSaveData {
  coins: number;
  unlockedLevel: number;
  levelStars: Record<number, number>; // levelId -> stars (0-3)
  renovations: Record<string, boolean>; // itemId -> purchased
  soundMuted: boolean;
  narrative: NarrativeSaveState;
}

export interface RenovationItem {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: 'bed' | 'window' | 'fireplace' | 'carpet' | 'lamp' | 'cat';
  icon: string;
}
