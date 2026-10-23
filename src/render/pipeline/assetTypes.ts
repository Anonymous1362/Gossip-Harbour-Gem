import * as THREE from 'three';

export type AssetCategory = 'environment' | 'prop' | 'character' | 'structure';

export interface AssetMetadata {
  id: string;
  name: string;
  category: AssetCategory;
  triangles: number;
  description: string;
  isAnimated: boolean;
  availableClips?: string[];
  dimensions?: { width: number; height: number; depth: number };
}

export interface AnimationController {
  currentClip: string;
  playClip: (clipName: string, loop?: boolean, timeScale?: number) => void;
  stop: () => void;
  setTimeScale: (scale: number) => void;
  update: (dt: number) => void;
  getAvailableClips: () => string[];
}

export interface StaticAssetInstance {
  root: THREE.Group;
  metadata: AssetMetadata;
}

export interface AnimatedPropInstance {
  root: THREE.Group;
  metadata: AssetMetadata;
  animator: AnimationController;
}
