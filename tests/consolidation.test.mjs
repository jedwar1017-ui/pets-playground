import test from 'node:test';
import assert from 'node:assert/strict';
import {PETS, eligiblePets, getPet, artLabel} from '../pets.mjs';
import {dailyRotation} from '../rotation.mjs';

const verified = {fileVersion: 'fixture-v1', formatValidated: true, frameCount: 24,
  playbackVerified: true, runtimeInstalled: true, targetRuntime: 'test-fixture'};

test('historical location and device clips do not establish verified eligibility', () => {
  assert.equal(eligiblePets().length, 0);
  assert.equal(eligiblePets('preview').length, 8);
  assert.equal(dailyRotation().slots.filter(Boolean).length, 0);
  for (const pet of PETS) {
    assert.ok(pet.assets.every(a => a.provenance.record && !a.playbackVerified));
    assert.doesNotMatch(artLabel(pet, false), /not made|still empty/);
    assert.match(artLabel(pet, true), /this device only/);
  }
});

test('every verification gate is required; two verified forms consume one slot', () => {
  const pet = {...getPet('bramble'), assets: [{...verified}, {...verified}]};
  assert.equal(eligiblePets('verified', [pet]).length, 1);
  for (const [key, value] of Object.entries({fileVersion: null, formatValidated: false,
    frameCount: 1, playbackVerified: false, runtimeInstalled: false, targetRuntime: ''})) {
    assert.equal(eligiblePets('verified', [{...pet, assets: [{...verified, [key]: value}]}]).length, 0, key);
  }
  assert.equal(dailyRotation('verified', new Date(), [pet]).slots.filter(Boolean).length, 1);
  assert.throws(() => eligiblePets('live'), /Unknown rotation mode/);
});

test('preview and verified schedules share Chicago midnight and bench fairness', () => {
  const roster = PETS.map(p => ({...p, assets: [{...verified}]}));
  const before = new Date('2026-11-02T05:59:59Z'), after = new Date('2026-11-02T06:00:00Z');
  for (const mode of ['preview', 'verified']) {
    const a = dailyRotation(mode, before, roster), b = dailyRotation(mode, after, roster);
    assert.notEqual(a.benched[0].id, b.benched[0].id);
    assert.equal(new Set(Array.from({length: 8}, (_, i) => dailyRotation(mode,
      new Date(Date.UTC(2026, 10, 2 + i, 18)), roster).benched[0].id)).size, 8);
  }
});

test('manifest preserves identity, provenance scope and immutable form records', () => {
  assert.equal(getPet('bramble-cosmic'), null);
  assert.ok(getPet('zyphira'));
  assert.match(getPet('stardust-nova').assets[0].provenance.scope, /mapping pending/);
  assert.match(getPet('aetherion').assets[0].provenance.record, /issue:2/);
  assert.throws(() => { getPet('bramble').forms[1].id = 'extra-pet'; }, TypeError);
  assert.throws(() => { getPet('astryx').assets[0].playbackVerified = true; }, TypeError);
});
