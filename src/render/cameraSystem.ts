import * as THREE from 'three';
import { CameraPreset } from '../game/narrativeTypes';

export interface CameraPresetConfig {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  transitionSpeed: number; // lerp weight multiplier
  driftAmount: number;     // subtle handheld motion
}

export class DynamicCameraSystem {
  private camera: THREE.PerspectiveCamera;
  private currentMode: CameraPreset = 'gameplay';

  // Current interpolated values
  private currentPosition = new THREE.Vector3(0, -35, 1680);
  private currentTarget = new THREE.Vector3(0, -35, 0);
  private currentFov = 28;

  // Preset Configurations
  private presets: Record<CameraPreset, CameraPresetConfig> = {
    gameplay: {
      position: new THREE.Vector3(0, -35, 1680),
      target: new THREE.Vector3(0, -35, 0),
      fov: 28,
      transitionSpeed: 4.5,
      driftAmount: 0.0,
    },
    cinematic: {
      // Third-person perspective focused on character, bed, and golden jar
      position: new THREE.Vector3(-45, -210, 920),
      target: new THREE.Vector3(-35, -255, 15),
      fov: 31,
      transitionSpeed: 3.8,
      driftAmount: 1.2,
    },
    strategic: {
      // Wide overhead perspective capturing the full 2-story cutaway loft & bay
      position: new THREE.Vector3(40, 60, 2250),
      target: new THREE.Vector3(0, 10, -50),
      fov: 34,
      transitionSpeed: 4.0,
      driftAmount: 0.4,
    },
  };

  private shakeIntensity = 0;
  private elapsedTime = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentPosition.copy(camera.position);
    this.currentFov = camera.fov;
  }

  public setMode(mode: CameraPreset): void {
    this.currentMode = mode;
  }

  public getMode(): CameraPreset {
    return this.currentMode;
  }

  public triggerShake(intensity = 4.0): void {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 12.0);
  }

  public update(dt: number, aspectMultiplier = 1.0): void {
    this.elapsedTime += dt;
    const config = this.presets[this.currentMode];

    // Compute desired target position with aspect adjustment
    const desiredPos = config.position.clone();
    desiredPos.z *= aspectMultiplier;

    // Apply handheld / environmental drift
    if (config.driftAmount > 0) {
      const driftX = Math.sin(this.elapsedTime * 0.8) * 3.5 * config.driftAmount;
      const driftY = Math.cos(this.elapsedTime * 1.1) * 2.2 * config.driftAmount;
      desiredPos.x += driftX;
      desiredPos.y += driftY;
    }

    // Apply shake impulse
    if (this.shakeIntensity > 0.01) {
      desiredPos.x += (Math.random() - 0.5) * this.shakeIntensity * 2;
      desiredPos.y += (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity = THREE.MathUtils.lerp(this.shakeIntensity, 0, dt * 10);
    }

    // Smoothly interpolate camera position and target
    const lerpFactor = Math.min(1.0, dt * config.transitionSpeed);
    this.currentPosition.lerp(desiredPos, lerpFactor);
    this.currentTarget.lerp(config.target, lerpFactor);

    // Smoothly interpolate FOV
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, config.fov, lerpFactor);

    // Apply to Three.js camera
    this.camera.position.copy(this.currentPosition);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.currentTarget);
  }
}
