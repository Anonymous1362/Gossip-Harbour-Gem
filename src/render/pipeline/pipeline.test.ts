import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LOW_POLY_PALETTE, getLowPolyMaterial, countTriangles } from './palette';
import { createQuayHarborChest, createWharfBollardLantern } from './models/staticAssets';
import { createMaritimeWindVentProp, createQuayPendulumClock } from './models/animatedProps';
import { assetPipeline } from './assetLoader';

test('low-poly palette returns cached materials with flatShading enabled', () => {
  const mat1 = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.3 });
  assert.equal(mat1.flatShading, true, 'Low poly materials must have flatShading true');
  assert.equal(mat1.roughness, 0.3);

  // Material caching: requesting identical options must return same material instance
  const mat2 = getLowPolyMaterial({ colorKey: 'antiqueBrass', roughness: 0.3 });
  assert.equal(mat1, mat2, 'Identical material requests must reuse cached instance');
});

test('static environmental asset (Quay Chest) conforms to budget and structure', () => {
  const chest = createQuayHarborChest();
  assert.equal(chest.metadata.category, 'environment');
  assert.equal(chest.metadata.isAnimated, false);

  const triCount = countTriangles(chest.root);
  assert.ok(triCount > 20, 'Chest must have geometric triangles');
  assert.ok(triCount < 300, `Chest triangles (${triCount}) must be well under 300 triangle budget`);
  assert.equal(chest.metadata.triangles, triCount);
});

test('static environmental asset (Wharf Bollard) conforms to budget', () => {
  const bollard = createWharfBollardLantern();
  assert.equal(bollard.metadata.category, 'environment');
  assert.ok(bollard.metadata.triangles > 20);
  assert.ok(bollard.metadata.triangles < 250);
});

test('animated prop (Maritime Wind Vent) integrates with character/prop controller', () => {
  const vent = createMaritimeWindVentProp();
  assert.equal(vent.metadata.category, 'prop');
  assert.equal(vent.metadata.isAnimated, true);
  assert.ok(vent.animator, 'Must expose an animation controller');

  const clips = vent.animator.getAvailableClips();
  assert.ok(clips.includes('idle'), 'Must have default idle clip');
  assert.ok(clips.includes('fast_spin'));

  // Test animation update step
  const rotor = vent.root.children.find((c) => c.position.z === 8);
  assert.ok(rotor, 'Rotor group must exist');
  const initialZRot = rotor.rotation.z;

  vent.animator.playClip('idle');
  vent.animator.update(0.1); // step 100ms
  assert.notEqual(rotor.rotation.z, initialZRot, 'Rotor rotation should advance when updated');
});

test('animated prop (Pendulum Clock) oscillates correctly', () => {
  const clock = createQuayPendulumClock();
  assert.equal(clock.metadata.isAnimated, true);
  assert.ok(clock.animator.getAvailableClips().includes('tick_tock'));

  // Check pendulum node exists and updates
  const pendulum = clock.root.children.find((c) => c.position.y === -6);
  assert.ok(pendulum, 'Pendulum group must exist');

  clock.animator.update(0.25);
  assert.notEqual(pendulum.rotation.z, 0, 'Pendulum must oscillate over time');
});

test('asset pipeline registry exposes all built-in assets', () => {
  const list = assetPipeline.getBuiltInAssetList();
  assert.ok(list.length >= 4, 'Must register at least 4 demo assets');
  const ids = list.map((a) => a.id);
  assert.ok(ids.includes('quay_chest'));
  assert.ok(ids.includes('maritime_wind_vent'));
  assert.ok(ids.includes('wharf_bollard'));
  assert.ok(ids.includes('quay_pendulum_clock'));
});
