import test from "node:test";
import assert from "node:assert/strict";
import { INDEX_LISTED, buildRotation, localDayIndex } from "../rotation.mjs";

test("empty eligible list produces seven empty slots", () => {
  assert.deepEqual(buildRotation([], 7, 0), { slots: Array(7).fill(null), benched: [] });
});
test("four candidates fill four slots; three remain vacant", () => {
  const {slots, benched} = buildRotation(INDEX_LISTED, 7, 2);
  assert.equal(slots.length, 7);
  assert.equal(slots.filter(Boolean).length, 4);
  assert.equal(benched.length, 0);
});
test("eight eligible pets bench exactly one and rotate daily", () => {
  const pets = Array.from({length:8}, (_,i)=>({id:String(i),name:"Pet "+i}));
  const a = buildRotation(pets, 7, 0), b = buildRotation(pets, 7, 1);
  assert.equal(a.benched.length, 1);
  assert.equal(b.benched.length, 1);
  assert.notEqual(a.benched[0].id, b.benched[0].id);
  assert.equal(new Set(Array.from({length:8},(_,i)=>buildRotation(pets,7,i).benched[0].id)).size,8);
});
test("rotation does not mutate its input", () => {
  const before=INDEX_LISTED.map(p=>p.id);
  buildRotation(INDEX_LISTED,7,12);
  assert.deepEqual(INDEX_LISTED.map(p=>p.id),before);
});
test("duplicates are rejected", () => {
  assert.throws(()=>buildRotation([{id:"a"},{id:"a"}]), /Duplicate/);
});
test("invalid slot counts are rejected", () => {
  assert.throws(()=>buildRotation(INDEX_LISTED,0), RangeError);
});
test("local day index is stable within the same calendar date", () => {
  assert.equal(localDayIndex(new Date(2026,9,25,0,1)),localDayIndex(new Date(2026,9,25,23,59)));
});
