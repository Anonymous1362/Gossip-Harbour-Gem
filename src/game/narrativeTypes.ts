import { PaletteKey } from '../render/pipeline/palette';

export type CameraPreset = 'gameplay' | 'cinematic' | 'strategic';

export interface StoryChoice {
  id: string;
  label: string;
  tagline: string;
  description: string;
  consequences: {
    goldDelta?: number;
    moralAlignment: 'compassion' | 'industry' | 'fortitude';
    summary: string;
  };
  visualImpact: {
    cameraTarget: CameraPreset;
    highlightPropId?: string;
    soundFx: 'hearth' | 'steam' | 'bell' | 'chime';
  };
  icon: string;
  accentColor: PaletteKey;
}

export interface StoryBranchPoint {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  situation: string;
  minLevelRequired: number;
  cameraPreset: CameraPreset;
  choices: StoryChoice[];
}

export interface StoryEnding {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  epilogue: string;
  badge: string;
}

export interface NarrativeSaveState {
  currentChapter: number;
  chosenOptions: Record<string, string>; // branchId -> choiceId
  activeEndingId?: string;
  history: Array<{
    branchId: string;
    choiceId: string;
    timestamp: number;
  }>;
}
