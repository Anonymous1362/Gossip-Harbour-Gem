import * as THREE from 'three';
import { getLowPolyMaterial, countTriangles } from '../palette';
import { AnimatedPropInstance, AnimationController } from '../assetTypes';

/**
 * Example: Basic Animated Prop
 * Low-poly Maritime Turbine Vent & Weather Vane.
 * Demonstrates hierarchical transform animation compatible with game loops & character controllers.
 */
export function createMaritimeWindVentProp(): AnimatedPropInstance {
  const root = new THREE.Group();
  root.name = 'maritime_wind_vent';

  const brassMat = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.35, metalness: 0.85 });
  const copperMat = getLowPolyMaterial({ colorKey: 'copperGlow', roughness: 0.4, metalness: 0.8 });
  const ironMat = getLowPolyMaterial({ colorKey: 'ironDark', roughness: 0.6, metalness: 0.7 });
  const bladeMat = getLowPolyMaterial({ colorKey: 'tealLattice', roughness: 0.4, metalness: 0.3 });

  // 1. Fixed Base Mount Plate
  const baseGeo = new THREE.CylinderGeometry(14, 16, 5, 8);
  const baseMesh = new THREE.Mesh(baseGeo, ironMat);
  baseMesh.position.y = 2.5;
  root.add(baseMesh);

  // 2. Vertical Support Column
  const postGeo = new THREE.CylinderGeometry(4, 5, 28, 8);
  const postMesh = new THREE.Mesh(postGeo, ironMat);
  postMesh.position.y = 19;
  root.add(postMesh);

  // 3. Central Gearbox Hub Housing
  const hubHousingGeo = new THREE.BoxGeometry(14, 14, 14);
  const hubHousing = new THREE.Mesh(hubHousingGeo, copperMat);
  hubHousing.position.y = 35;
  root.add(hubHousing);

  // 4. ANIMATED COMPONENT: Spinning Turbine Rotor Group
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 35, 8); // protruding forward
  root.add(rotorGroup);

  // Rotor central nosecone
  const noseConeGeo = new THREE.ConeGeometry(4, 8, 8);
  noseConeGeo.rotateX(Math.PI / 2);
  const noseCone = new THREE.Mesh(noseConeGeo, brassMat);
  rotorGroup.add(noseCone);

  // 4 Low-Poly Angled Turbine Blades
  const bladeGeo = new THREE.BoxGeometry(4.5, 20, 1.2);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.z = (i * Math.PI) / 2;
    blade.rotation.y = 0.28; // aerodynamic pitch angle
    blade.position.set(
      Math.cos((i * Math.PI) / 2) * 11,
      Math.sin((i * Math.PI) / 2) * 11,
      0
    );
    rotorGroup.add(blade);
  }

  // 5. ANIMATED COMPONENT: Oscillating Top Vane
  const vaneGroup = new THREE.Group();
  vaneGroup.position.set(0, 42, 0);
  root.add(vaneGroup);

  const vaneFinGeo = new THREE.BufferGeometry();
  // Low-poly triangular fin
  const vertices = new Float32Array([
    0, 0, -10,
    0, 14, -16,
    0, 2, 8,
  ]);
  vaneFinGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  vaneFinGeo.computeVertexNormals();
  const vaneFin = new THREE.Mesh(vaneFinGeo, copperMat);
  vaneGroup.add(vaneFin);

  const vaneWeight = new THREE.Mesh(new THREE.SphereGeometry(3, 6, 6), brassMat);
  vaneWeight.position.set(0, 2, 9);
  vaneGroup.add(vaneWeight);

  const triangles = countTriangles(root);

  // Animation Controller State
  let currentClip = 'idle';
  let isPlaying = true;
  let timeScale = 1.0;
  let elapsed = 0;

  const animator: AnimationController = {
    get currentClip() {
      return currentClip;
    },
    playClip: (clipName: string, loop = true, scale = 1.0) => {
      currentClip = clipName;
      isPlaying = true;
      timeScale = scale;
    },
    stop: () => {
      isPlaying = false;
    },
    setTimeScale: (scale: number) => {
      timeScale = scale;
    },
    getAvailableClips: () => ['idle', 'fast_spin', 'reverse', 'breeze_pulse'],
    update: (dt: number) => {
      if (!isPlaying) return;
      const effectiveDt = dt * timeScale;
      elapsed += effectiveDt;

      switch (currentClip) {
        case 'fast_spin': {
          // Rapid turbine rotation
          rotorGroup.rotation.z -= effectiveDt * 14;
          // Responsive vane jitter
          vaneGroup.rotation.y = Math.sin(elapsed * 6) * 0.4 + Math.sin(elapsed * 17) * 0.08;
          break;
        }
        case 'reverse': {
          rotorGroup.rotation.z += effectiveDt * 6;
          vaneGroup.rotation.y = Math.cos(elapsed * 2) * 0.25;
          break;
        }
        case 'breeze_pulse': {
          // Dynamic gust speed
          const gust = (Math.sin(elapsed * 2) + 1.2) * 4;
          rotorGroup.rotation.z -= effectiveDt * gust;
          vaneGroup.rotation.y = Math.sin(elapsed * 1.5) * 0.6;
          break;
        }
        case 'idle':
        default: {
          // Calm steady spin
          rotorGroup.rotation.z -= effectiveDt * 3.5;
          // Subtle drifting vane
          vaneGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.18;
          break;
        }
      }
    },
  };

  return {
    root,
    metadata: {
      id: 'maritime_wind_vent',
      name: 'Maritime Turbine Vent',
      category: 'prop',
      triangles,
      description: 'Animated maritime rooftop vent with spinning brass turbine blades and responsive weather vane.',
      isAnimated: true,
      availableClips: ['idle', 'fast_spin', 'reverse', 'breeze_pulse'],
      dimensions: { width: 34, height: 58, depth: 24 },
    },
    animator,
  };
}

/**
 * Example 2: Basic Animated Prop
 * Low-Poly Quay Pendulum Wall Clock.
 * Features synchronized pendulum oscillation and stepping clock hands.
 */
export function createQuayPendulumClock(): AnimatedPropInstance {
  const root = new THREE.Group();
  root.name = 'quay_pendulum_clock';

  const woodMat = getLowPolyMaterial({ colorKey: 'mahoganyDark', roughness: 0.7 });
  const brassMat = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.3, metalness: 0.9 });
  const faceMat = getLowPolyMaterial({ colorKey: 'creamInterior', roughness: 0.8 });
  const handMat = getLowPolyMaterial({ colorKey: 'ironDark', roughness: 0.5, metalness: 0.8 });

  // Clock Case (Octagonal low-poly housing)
  const caseGeo = new THREE.CylinderGeometry(15, 15, 6, 8);
  caseGeo.rotateX(Math.PI / 2);
  const caseMesh = new THREE.Mesh(caseGeo, woodMat);
  root.add(caseMesh);

  // Clock Dial Face
  const dialGeo = new THREE.CircleGeometry(12.5, 12);
  const dial = new THREE.Mesh(dialGeo, faceMat);
  dial.position.z = 3.1;
  root.add(dial);

  // Hour & Minute Hands
  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 0.4), handMat);
  minuteHand.position.set(0, 4, 3.4);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 6, 0.4), handMat);
  hourHand.position.set(0, 2.5, 3.5);
  root.add(minuteHand, hourHand);

  // ANIMATED COMPONENT: Swinging Pendulum
  const pendulumGroup = new THREE.Group();
  pendulumGroup.position.set(0, -6, 1);
  root.add(pendulumGroup);

  const rodGeo = new THREE.CylinderGeometry(0.8, 0.8, 22, 6);
  const rodMesh = new THREE.Mesh(rodGeo, brassMat);
  rodMesh.position.y = -11;
  pendulumGroup.add(rodMesh);

  const bobGeo = new THREE.CylinderGeometry(5, 5, 2.5, 8);
  bobGeo.rotateX(Math.PI / 2);
  const bob = new THREE.Mesh(bobGeo, brassMat);
  bob.position.y = -22;
  pendulumGroup.add(bob);

  const triangles = countTriangles(root);

  let currentClip = 'tick_tock';
  let isPlaying = true;
  let timeScale = 1.0;
  let elapsed = 0;

  const animator: AnimationController = {
    get currentClip() {
      return currentClip;
    },
    playClip: (clipName: string, loop = true, scale = 1.0) => {
      currentClip = clipName;
      isPlaying = true;
      timeScale = scale;
    },
    stop: () => {
      isPlaying = false;
    },
    setTimeScale: (scale: number) => {
      timeScale = scale;
    },
    getAvailableClips: () => ['tick_tock', 'rapid_chime', 'winding'],
    update: (dt: number) => {
      if (!isPlaying) return;
      const effectiveDt = dt * timeScale;
      elapsed += effectiveDt;

      switch (currentClip) {
        case 'rapid_chime': {
          pendulumGroup.rotation.z = Math.sin(elapsed * 12) * 0.45;
          minuteHand.rotation.z -= effectiveDt * 8;
          hourHand.rotation.z -= effectiveDt * 1.5;
          break;
        }
        case 'winding': {
          pendulumGroup.rotation.z = Math.sin(elapsed * 2) * 0.08;
          minuteHand.rotation.z += effectiveDt * 16;
          break;
        }
        case 'tick_tock':
        default: {
          // Classic 1Hz clock pendulum swing
          pendulumGroup.rotation.z = Math.sin(elapsed * 3.14159) * 0.28;
          // Stepped ticking hands
          minuteHand.rotation.z = -Math.floor(elapsed) * (Math.PI / 30);
          hourHand.rotation.z = -elapsed * 0.05;
          break;
        }
      }
    },
  };

  return {
    root,
    metadata: {
      id: 'quay_pendulum_clock',
      name: 'Quay Pendulum Clock',
      category: 'prop',
      triangles,
      description: 'Antique brass & mahogany wall clock with working pendulum and stepping mechanical hands.',
      isAnimated: true,
      availableClips: ['tick_tock', 'rapid_chime', 'winding'],
      dimensions: { width: 30, height: 50, depth: 10 },
    },
    animator,
  };
}
