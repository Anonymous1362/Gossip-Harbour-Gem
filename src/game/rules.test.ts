import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStars, evaluateLevelState, validateLevelConfig } from './rules';
import { LEVELS, RENOVATION_ITEMS } from './levels';

test('calculateStars awards 3 stars when coins >= 92% and spills <= 2', () => {
  const level = LEVELS[0];
  const stars = calculateStars(level, 210, 1, 220); // 210/220 = 95.45%
  assert.equal(stars, 3);
});

test('calculateStars awards 2 stars when coins >= 75% but < 92%', () => {
  const level = LEVELS[0];
  const stars = calculateStars(level, 180, 5, 220); // 180/220 = 81.8%
  assert.equal(stars, 2);
});

test('calculateStars awards 1 star when coins >= 50% and < 75%', () => {
  const level = LEVELS[0];
  const stars = calculateStars(level, 120, 10, 220); // 120/220 = 54.5%
  assert.equal(stars, 1);
});

test('calculateStars awards 0 stars when coins < 50%', () => {
  const level = LEVELS[0];
  const stars = calculateStars(level, 90, 50, 220); // 90/220 = 40.9%
  assert.equal(stars, 0);
});

test('evaluateLevelState flags win only when flow has settled and coins >= 50%', () => {
  const level = LEVELS[0];
  const unsettled = evaluateLevelState(level, 200, 0, 220, false);
  assert.equal(unsettled.isWin, false, 'Should not win before flow settles');

  const settled = evaluateLevelState(level, 200, 0, 220, true);
  assert.equal(settled.isWin, true, 'Should win when settled with enough coins');
});

test('validate all 10 authored levels for structural integrity', () => {
  assert.equal(LEVELS.length, 10, 'Must have exactly 10 authored levels');

  for (const level of LEVELS) {
    const check = validateLevelConfig(level);
    assert.equal(
      check.valid,
      true,
      `Level ${level.id} (${level.name}) failed validation: ${check.errors.join(', ')}`
    );
    assert.ok(level.coinCount >= 220, `Level ${level.id} coinCount must be at least 220`);
    assert.ok(level.rods.length >= 1, `Level ${level.id} must have at least 1 rod`);
  }
});

test('validate renovation items have positive costs and unique IDs', () => {
  const ids = new Set<string>();
  assert.ok(RENOVATION_ITEMS.length >= 5, 'Must have at least 5 renovation items');
  for (const item of RENOVATION_ITEMS) {
    assert.ok(item.cost > 0, `Item ${item.id} must have positive cost`);
    assert.ok(!ids.has(item.id), `Item ${item.id} has duplicate ID`);
    ids.add(item.id);
  }
});
