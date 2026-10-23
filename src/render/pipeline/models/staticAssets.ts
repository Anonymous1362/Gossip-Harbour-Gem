import * as THREE from 'three';
import { getLowPolyMaterial, countTriangles } from '../palette';
import { StaticAssetInstance } from '../assetTypes';

/**
 * Example 1: Static Environmental Asset
 * Low-poly Quay Maritime Sea Chest.
 * Built with modular low-poly geometry and palette-matched flat-shaded materials.
 */
export function createQuayHarborChest(): StaticAssetInstance {
  const root = new THREE.Group();
  root.name = 'quay_harbor_chest';

  // Materials from unified low-poly palette
  const woodMat = getLowPolyMaterial({ colorKey: 'woodWarm', roughness: 0.8, metalness: 0.05 });
  const darkWoodMat = getLowPolyMaterial({ colorKey: 'mahoganyDark', roughness: 0.75 });
  const brassMat = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.35, metalness: 0.85 });
  const ironMat = getLowPolyMaterial({ colorKey: 'ironDark', roughness: 0.6, metalness: 0.7 });

  // 1. Main Chest Base Box
  const baseGeo = new THREE.BoxGeometry(42, 22, 26, 1, 1, 1);
  const baseMesh = new THREE.Mesh(baseGeo, woodMat);
  baseMesh.position.y = 11;
  root.add(baseMesh);

  // 2. Chest Trim Ribs (Dark Wood)
  const ribGeo = new THREE.BoxGeometry(43.5, 22.4, 4, 1, 1, 1);
  const rib1 = new THREE.Mesh(ribGeo, darkWoodMat);
  rib1.position.set(0, 11, -9);
  const rib2 = new THREE.Mesh(ribGeo, darkWoodMat);
  rib2.position.set(0, 11, 9);
  root.add(rib1, rib2);

  // 3. Arched Lid
  // Low-poly semi-cylinder lid (8 segments for crisp faceted look)
  const lidGeo = new THREE.CylinderGeometry(13.2, 13.2, 42.5, 8, 1, false, 0, Math.PI);
  lidGeo.rotateZ(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, woodMat);
  lidMesh.position.set(0, 22, 0);
  root.add(lidMesh);

  // 4. Brass Corner Reinforcements
  const cornerGeo = new THREE.BoxGeometry(4, 23, 4);
  const corners = [
    [-20, 11, -12],
    [20, 11, -12],
    [-20, 11, 12],
    [20, 11, 12],
  ];
  corners.forEach(([x, y, z]) => {
    const c = new THREE.Mesh(cornerGeo, brassMat);
    c.position.set(x, y, z);
    root.add(c);
  });

  // 5. Front Iron Clasp and Padlock
  const claspGeo = new THREE.BoxGeometry(5, 8, 2);
  const clasp = new THREE.Mesh(claspGeo, ironMat);
  clasp.position.set(0, 19, 13.8);
  root.add(clasp);

  const lockGeo = new THREE.CylinderGeometry(2, 2, 3, 6);
  const lock = new THREE.Mesh(lockGeo, brassMat);
  lock.position.set(0, 15, 14.5);
  root.add(lock);

  // 6. Side Hemp Rope Handles
  const handleGeo = new THREE.TorusGeometry(3.5, 1.2, 4, 8, Math.PI);
  const handleMat = getLowPolyMaterial({ colorKey: 'driftwood', roughness: 0.9 });
  const handleL = new THREE.Mesh(handleGeo, handleMat);
  handleL.rotation.y = -Math.PI / 2;
  handleL.position.set(-21.5, 12, 0);

  const handleR = new THREE.Mesh(handleGeo, handleMat);
  handleR.rotation.y = Math.PI / 2;
  handleR.position.set(21.5, 12, 0);
  root.add(handleL, handleR);

  const triangles = countTriangles(root);

  return {
    root,
    metadata: {
      id: 'quay_chest',
      name: 'Quay Harbor Chest',
      category: 'environment',
      triangles,
      description: 'A heavy brass-reinforced oak mariner chest with iron lock and rope handles.',
      isAnimated: false,
      dimensions: { width: 44, height: 35, depth: 28 },
    },
  };
}

/**
 * Example 2: Static Environmental Asset
 * Low-poly Wharf Mooring Bollard & Lantern.
 */
export function createWharfBollardLantern(): StaticAssetInstance {
  const root = new THREE.Group();
  root.name = 'wharf_bollard_lantern';

  const ironMat = getLowPolyMaterial({ colorKey: 'ironDark', roughness: 0.6, metalness: 0.8 });
  const brassMat = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.35, metalness: 0.85 });
  const ropeMat = getLowPolyMaterial({ colorKey: 'driftwood', roughness: 0.95 });
  const lightMat = getLowPolyMaterial({
    colorKey: 'amberLantern',
    emissiveKey: 'amberLantern',
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });

  // 1. Heavy Iron Bollard Post
  const bollardGeo = new THREE.CylinderGeometry(8, 10, 36, 8);
  const bollard = new THREE.Mesh(bollardGeo, ironMat);
  bollard.position.y = 18;
  root.add(bollard);

  // Bollard top cap
  const capGeo = new THREE.CylinderGeometry(10.5, 8, 5, 8);
  const cap = new THREE.Mesh(capGeo, ironMat);
  cap.position.y = 37.5;
  root.add(cap);

  // 2. Coiled Mooring Rope around Base
  const ropeRingGeo = new THREE.TorusGeometry(10.5, 2.4, 5, 10);
  ropeRingGeo.rotateX(Math.PI / 2);
  const rope = new THREE.Mesh(ropeRingGeo, ropeMat);
  rope.position.y = 6;
  root.add(rope);

  // 3. Hanging Brass Lantern Arm
  const armGeo = new THREE.CylinderGeometry(1.4, 1.4, 14, 6);
  const arm = new THREE.Mesh(armGeo, brassMat);
  arm.rotation.z = Math.PI / 3;
  arm.position.set(7, 36, 0);
  root.add(arm);

  // 4. Lantern Body
  const lanternGroup = new THREE.Group();
  lanternGroup.position.set(13, 31, 0);

  const glassGeo = new THREE.CylinderGeometry(3.5, 3.5, 8, 6);
  const glass = new THREE.Mesh(glassGeo, lightMat);
  lanternGroup.add(glass);

  const lanternCapGeo = new THREE.ConeGeometry(5, 4, 6);
  const lanternCap = new THREE.Mesh(lanternCapGeo, brassMat);
  lanternCap.position.y = 5.5;
  lanternGroup.add(lanternCap);

  root.add(lanternGroup);

  const triangles = countTriangles(root);

  return {
    root,
    metadata: {
      id: 'wharf_bollard',
      name: 'Wharf Bollard & Lantern',
      category: 'environment',
      triangles,
      description: 'Cast-iron harbor bollard coiled with hemp rope, bearing an amber quay lantern.',
      isAnimated: false,
      dimensions: { width: 30, height: 42, depth: 22 },
    },
  };
}
