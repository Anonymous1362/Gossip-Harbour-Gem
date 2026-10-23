import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetMetadata, StaticAssetInstance, AnimatedPropInstance, AnimationController } from './assetTypes';
import { countTriangles, getLowPolyMaterial } from './palette';
import { createQuayHarborChest, createWharfBollardLantern } from './models/staticAssets';
import { createMaritimeWindVentProp, createQuayPendulumClock } from './models/animatedProps';

export interface ImportOptions {
  targetHeight?: number;
  centerOrigin?: boolean;
  applyLowPolyPalette?: boolean;
  castShadow?: boolean;
}

export class AssetPipeline {
  private gltfLoader = new GLTFLoader();

  /**
   * Registry of all pipeline demo assets ready for instant instantiation.
   */
  public getBuiltInAssetList(): AssetMetadata[] {
    return [
      createQuayHarborChest().metadata,
      createWharfBollardLantern().metadata,
      createMaritimeWindVentProp().metadata,
      createQuayPendulumClock().metadata,
    ];
  }

  /**
   * Instantiates a built-in asset by ID.
   */
  public createBuiltInAsset(id: string): StaticAssetInstance | AnimatedPropInstance | null {
    switch (id) {
      case 'quay_chest':
        return createQuayHarborChest();
      case 'wharf_bollard':
        return createWharfBollardLantern();
      case 'maritime_wind_vent':
        return createMaritimeWindVentProp();
      case 'quay_pendulum_clock':
        return createQuayPendulumClock();
      default:
        return null;
    }
  }

  /**
   * Imports an external GLTF/GLB file with scale normalization and animation extraction.
   * If the fetch fails or URL is unavailable, cleanly falls back to procedural low-poly model.
   */
  public async loadModel(
    url: string,
    options: ImportOptions = {}
  ): Promise<StaticAssetInstance | AnimatedPropInstance> {
    try {
      const gltf = await this.gltfLoader.loadAsync(url);
      const root = gltf.scene;

      // Normalize size
      const bbox = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      if (options.targetHeight && size.y > 0) {
        const scale = options.targetHeight / size.y;
        root.scale.setScalar(scale);
      }

      if (options.centerOrigin) {
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        root.position.sub(center);
      }

      // Convert or optimize materials for low-poly flat shading if requested
      if (options.applyLowPolyPalette) {
        root.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = options.castShadow ?? true;
            if (child.material) {
              const origMat = child.material as THREE.MeshStandardMaterial;
              child.material = new THREE.MeshStandardMaterial({
                color: origMat.color || 0xcccccc,
                roughness: 0.7,
                metalness: 0.1,
                flatShading: true,
              });
            }
          }
        });
      }

      const triangles = countTriangles(root);
      const isAnimated = gltf.animations && gltf.animations.length > 0;

      if (isAnimated) {
        const mixer = new THREE.AnimationMixer(root);
        const clipActions = new Map<string, THREE.AnimationAction>();
        gltf.animations.forEach((clip) => {
          clipActions.set(clip.name, mixer.clipAction(clip));
        });

        let currentClip = gltf.animations[0].name;
        clipActions.get(currentClip)?.play();

        const animator: AnimationController = {
          get currentClip() {
            return currentClip;
          },
          playClip: (name: string) => {
            const act = clipActions.get(name);
            if (act) {
              clipActions.forEach((a) => a.stop());
              act.play();
              currentClip = name;
            }
          },
          stop: () => {
            mixer.stopAllAction();
          },
          setTimeScale: (scale: number) => {
            mixer.timeScale = scale;
          },
          getAvailableClips: () => gltf.animations.map((c) => c.name),
          update: (dt: number) => {
            mixer.update(dt);
          },
        };

        return {
          root,
          metadata: {
            id: 'imported_prop',
            name: 'Imported Animated Asset',
            category: 'prop',
            triangles,
            description: `Imported GLTF asset with ${gltf.animations.length} animation clips.`,
            isAnimated: true,
            availableClips: gltf.animations.map((c) => c.name),
          },
          animator,
        };
      }

      return {
        root,
        metadata: {
          id: 'imported_static',
          name: 'Imported Static Asset',
          category: 'environment',
          triangles,
          description: 'Imported static GLTF mesh model.',
          isAnimated: false,
        },
      };
    } catch (err) {
      console.warn('GLTF import failed or URL offline, using procedural low-poly fallback', err);
      // Fallback to Quay Chest
      return createQuayHarborChest();
    }
  }
}

export const assetPipeline = new AssetPipeline();
