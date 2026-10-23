import { GameSaveData } from '../game/types';

const STORAGE_KEY = 'lantern_quay_save_v1';

export const DEFAULT_SAVE_DATA: GameSaveData = {
  coins: 50,
  unlockedLevel: 1,
  levelStars: {},
  renovations: {},
  soundMuted: false,
  narrative: {
    currentChapter: 1,
    chosenOptions: {},
    history: [],
  },
};

export function loadSaveData(): GameSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      levelStars: parsed.levelStars || {},
      renovations: parsed.renovations || {},
      narrative: parsed.narrative || { ...DEFAULT_SAVE_DATA.narrative },
    };
  } catch (err) {
    console.warn('Failed to read save data from localStorage, using defaults', err);
    return { ...DEFAULT_SAVE_DATA };
  }
}

export function saveSaveData(data: GameSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to write save data to localStorage', err);
  }
}
