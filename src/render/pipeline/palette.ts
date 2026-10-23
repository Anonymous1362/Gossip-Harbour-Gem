import * as THREE from 'three';

/**
 * Consistent Stylized Low-Poly Maritime Palette for Lantern Quay.
 * Designed for flat-shaded low-poly aesthetics with distinct material properties.
 */
export const LOW_POLY_PALETTE = {
  // Woods
  mahoganyDark: 0x2e1a0f,
  woodWarm: 0x5c3826,
  driftwood: 0x8c7355,
  plankLight: 0xb58a57,

  // Metals
  antiqueBrass: 0xd4a359,
  polishedGold: 0xf59e0b,
  ironDark: 0x27272a,
  steelCool: 0x64748b,
  copperGlow: 0xd97706,

  // Accents & Gems
  tealLattice: 0x14b8a6,
  tealEmissive: 0x0d9488,
  coralShell: 0xf87171,
  coralEmissive: 0xb91c1c,
  amberLantern: 0xfbbf24,
  velvetCrimson: 0x881337,
  emeraldDeep: 0x064e3b,
  iceBlue: 0x7dd3fc,

  // Character & Creatures
  gingerFur: 0xea580c,
  warmSweater: 0xeab308,
  denimPants: 0x1e3a8a,
  skinTone: 0xfcd34d,
  creamInterior: 0xfef3c7,
} as const;

export type PaletteKey = keyof typeof LOW_POLY_PALETTE;

export interface MaterialOptions {
  colorKey: PaletteKey | number;
  roughness?: number;
  metalness?: number;
  emissiveKey?: PaletteKey | number;
  emissiveIntensity?: number;
  wireframe?: boolean;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/**
 * Creates or retrieves a cached flat-shaded material using the low-poly palette.
 * Caching shared materials prevents draw-call fragmentation and reduces memory footprint.
 */
export function getLowPolyMaterial(options: MaterialOptions): THREE.MeshStandardMaterial {
  const colorVal = typeof options.colorKey === 'string'
    ? LOW_POLY_PALETTE[options.colorKey]
    : options.colorKey;

  const emissiveVal = options.emissiveKey
    ? typeof options.emissiveKey === 'string'
      ? LOW_POLY_PALETTE[options.emissiveKey]
      : options.emissiveKey
    : 0x000000;

  const roughness = options.roughness ?? 0.7;
  const metalness = options.metalness ?? 0.1;
  const emissiveIntensity = options.emissiveIntensity ?? (options.emissiveKey ? 0.5 : 0);
  const wireframe = !!options.wireframe;

  const cacheKey = `${colorVal}_${roughness}_${metalness}_${emissiveVal}_${emissiveIntensity}_${wireframe}`;

  if (!materialCache.has(cacheKey)) {
    const mat = new THREE.MeshStandardMaterial({
      color: colorVal,
      roughness,
      metalness,
      emissive: emissiveVal,
      emissiveIntensity,
      flatShading: true, // Essential for stylized low-poly facet definition
      wireframe,
    });
    materialCache.set(cacheKey, mat);
  }

  return materialCache.get(cacheKey)!;
}

/**
 * Counts the exact triangle count of an entire 3D object hierarchy.
 */
export function countTriangles(root: THREE.Object3D): number {
  let triangles = 0;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry;
      if (geo.index) {
        triangles += geo.index.count / 3;
      } else if (geo.attributes.position) {
        triangles += geo.attributes.position.count / 3;
      }
    }
  });
  return Math.round(triangles);
}
