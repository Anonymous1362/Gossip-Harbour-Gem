import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_BRANCHES, STORY_ENDINGS, determineEnding } from './narrativeData';

test('narrative system has at least 3 major branching decision points', () => {
  assert.ok(STORY_BRANCHES.length >= 3, 'Must have at least 3 major story chapters');
  assert.equal(STORY_BRANCHES[0].id, 'ch1_heat_source');
  assert.equal(STORY_BRANCHES[1].id, 'ch2_harbor_signal');
  assert.equal(STORY_BRANCHES[2].id, 'ch3_quay_destiny');
});

test('each story branch point has at least 2 distinct choices with consequences', () => {
  const choiceIds = new Set<string>();

  for (const branch of STORY_BRANCHES) {
    assert.ok(branch.choices.length >= 2, `Branch ${branch.id} must offer at least 2 choices`);
    for (const choice of branch.choices) {
      assert.ok(choice.label.length > 0);
      assert.ok(choice.description.length > 0);
      assert.ok(choice.consequences.summary.length > 0);
      assert.ok(!choiceIds.has(choice.id), `Choice ID ${choice.id} must be unique`);
      choiceIds.add(choice.id);
    }
  }
});

test('determineEnding accurately maps player choices to 3 distinct endings', () => {
  // Test Haven Ending
  const endingHaven = determineEnding({ ch3_quay_destiny: 'c3_haven' });
  assert.equal(endingHaven?.id, 'haven');
  assert.equal(endingHaven?.badge, 'Beacon of Fellowship');

  // Test Observatory Ending
  const endingObs = determineEnding({ ch3_quay_destiny: 'c3_observatory' });
  assert.equal(endingObs?.id, 'observatory');
  assert.equal(endingObs?.badge, 'Master Architect');

  // Test Voyage Ending
  const endingVoyage = determineEnding({ ch3_quay_destiny: 'c3_voyage' });
  assert.equal(endingVoyage?.id, 'voyage');
  assert.equal(endingVoyage?.badge, 'Legendary Voyager');

  // Test unresolved
  assert.equal(determineEnding({}), null, 'Should return null if Chapter 3 not yet chosen');
});

test('all endings have complete narrative descriptions, epilogues and badges', () => {
  const endings = Object.values(STORY_ENDINGS);
  assert.equal(endings.length, 3);
  for (const end of endings) {
    assert.ok(end.title.length > 0);
    assert.ok(end.description.length > 0);
    assert.ok(end.epilogue.length > 0);
    assert.ok(end.badge.length > 0);
  }
});
