import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {PETS, getPet, petLook, artLabel, ART} from "../pets.mjs";
import {buildRotation, zonedDayIndex} from "../rotation.mjs";
import {createWorld, step, setAction, resize, poke, hold, release, modeOf, getPetState, ACTIONS, mulberry32, danceRing} from "../roam.mjs";
import {sniffClipType, checkClip, MAX_CLIP_BYTES} from "../clips.mjs";

const out = PETS.slice(0, 7), napping = PETS.slice(7);
const world = (seed = 3, w = 800, h = 500) => createWorld({width: w, height: h, pets: out, resting: napping, seed});
const run = (w, seconds, dt = 1 / 60) => { for (let t = 0; t < seconds; t += dt) step(w, dt); return w; };
const inside = w => w.pets.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= w.width && p.y >= 0 && p.y <= w.height);

// --- roster ---
test("roster: eight unique pets, Zyphira kept, Bramble Cosmic is a form not a pet", () => {
  assert.equal(PETS.length, 8);
  assert.equal(new Set(PETS.map(p => p.id)).size, 8);
  assert.ok(getPet("zyphira"));
  assert.equal(getPet("bramble-cosmic"), null);
  assert.deepEqual(getPet("bramble").forms.map(f => f.id), ["classic", "cosmic"]);
  assert.equal(petLook(getPet("bramble"), "cosmic").label, "Bramble Cosmic");
  assert.equal(petLook(getPet("bramble"), "classic").label, "Bramble");
  assert.equal(petLook(getPet("astryx"), "cosmic").label, "Astryx");
});

test("art labels never claim real art is installed", () => {
  for (const pet of PETS) assert.match(artLabel(pet, false), /^Placeholder/);
  assert.match(artLabel(getPet("aetherion"), true), /this device only/);
  assert.ok(PETS.every(p => Object.values(ART).includes(p.art)));
});

// --- daily line-up ---
test("seven out and one napping each day; everyone naps once over eight days", () => {
  const nappers = new Set();
  for (let d = 0; d < 8; d++) {
    const {slots, benched} = buildRotation(PETS, 7, 20000 + d);
    assert.equal(slots.filter(Boolean).length, 7);
    assert.equal(benched.length, 1);
    nappers.add(benched[0].id);
  }
  assert.equal(nappers.size, 8);
});

test("Central Time day changes at Chicago midnight, including across DST", () => {
  const ct = iso => zonedDayIndex(new Date(iso), "America/Chicago");
  assert.equal(ct("2026-10-28T04:59:00Z"), ct("2026-10-27T12:00:00Z")); // 11:59 pm CDT
  assert.equal(ct("2026-10-28T05:00:00Z"), ct("2026-10-27T12:00:00Z") + 1); // midnight CDT
  assert.equal(ct("2026-11-02T05:59:00Z") + 0, ct("2026-11-01T12:00:00Z")); // after fall-back, 11:59 pm CST
  assert.equal(ct("2026-11-02T06:00:00Z"), ct("2026-11-01T12:00:00Z") + 1);
  assert.equal(ct("2026-03-09T04:59:00Z"), ct("2026-03-08T12:00:00Z")); // after spring-forward
  assert.throws(() => zonedDayIndex(new Date("nope")), TypeError);
});

// --- roaming ---
test("pets stay inside the field and never become NaN, for every action", () => {
  for (const action of ACTIONS) {
    const w = world(9);
    setAction(w, action, action === "protect" ? "zyphira" : null);
    run(w, 30);
    assert.ok(inside(w), action);
  }
});

test("same seed gives the same movement; different seeds differ", () => {
  const a = run(world(5), 10), b = run(world(5), 10), c = run(world(6), 10);
  assert.deepEqual(a.pets.map(p => [p.x, p.y]), b.pets.map(p => [p.x, p.y]));
  assert.notDeepEqual(a.pets.map(p => [p.x, p.y]), c.pets.map(p => [p.x, p.y]));
});

test("roaming pets actually move around the field", () => {
  const w = world(11), start = w.pets.map(p => [p.x, p.y]);
  run(w, 20);
  const moved = w.pets.filter((p, i) => !p.sleeping && Math.hypot(p.x - start[i][0], p.y - start[i][1]) > 40);
  assert.ok(moved.length >= 5, "only " + moved.length + " moved");
});

test("pets don't pile on top of each other", () => {
  const w = run(world(2), 20);
  let close = 0;
  for (let i = 0; i < w.pets.length; i++) for (let j = i + 1; j < w.pets.length; j++)
    if (Math.hypot(w.pets[i].x - w.pets[j].x, w.pets[i].y - w.pets[j].y) < 20) close++;
  assert.equal(close, 0);
});

test("the napping pet stays asleep in the nest", () => {
  const w = world(4), nap = getPetState(w, napping[0].id), [x, y] = [nap.x, nap.y];
  for (const action of ACTIONS) { setAction(w, action); run(w, 3); }
  assert.equal(modeOf(w, nap), "sleep");
  assert.deepEqual([nap.x, nap.y], [x, y]);
});

test("free pets sometimes start playing together, and it ends", () => {
  const w = world(7, 500, 400);
  let started = false;
  for (let i = 0; i < 60 * 120 && !started; i++) { step(w, 1 / 60); started = w.pets.some(p => p.social); }
  assert.ok(started, "no pets played in two minutes");
  run(w, 8);
  assert.ok(w.pets.every(p => !p.social || p.social.left > 0));
});

test("rest brings everyone to a stop", () => {
  const w = run(world(8), 5);
  setAction(w, "rest");
  run(w, 4);
  assert.ok(w.pets.every(p => Math.hypot(p.vx, p.vy) < 1));
});

test("dance forms a ring around the middle", () => {
  const w = world(10);
  setAction(w, "dance");
  run(w, 12);
  const {rx, ry, cy} = danceRing(w), cx = w.width / 2;
  const d = w.pets.filter(p => !p.sleeping).map(p => Math.hypot((p.x - cx) / rx, (p.y - cy) / ry));
  assert.ok(Math.max(...d) - Math.min(...d) < 0.25, "ring spread " + (Math.max(...d) - Math.min(...d)));
});

test("protect gathers the others around the chosen pet", () => {
  const w = world(12);
  setAction(w, "protect", "mochi");
  assert.equal(w.focus, "mochi");
  run(w, 12);
  const m = getPetState(w, "mochi");
  for (const p of w.pets.filter(p => !p.sleeping && p.id !== "mochi")) assert.ok(Math.hypot(p.x - m.x, p.y - m.y) < 140, p.id);
  setAction(w, "protect", napping[0].id);
  assert.equal(w.focus, null, "a napping pet can't be the one guarded");
});

test("calm motion slows pets down", () => {
  const speedAfter = calm => { const w = world(13); w.calm = calm; run(w, 6); return Math.max(...w.pets.map(p => Math.hypot(p.vx, p.vy))); };
  assert.ok(speedAfter(true) < speedAfter(false));
});

test("dragging holds a pet in place, then it roams again", () => {
  const w = world(14);
  hold(w, "astryx", 100, 120);
  run(w, 2);
  const a = getPetState(w, "astryx");
  assert.equal(modeOf(w, a), "held");
  assert.ok(Math.hypot(a.x - 100, a.y - 120) < 1);
  release(w, "astryx");
  run(w, 8);
  assert.notEqual(modeOf(w, a), "held");
  hold(w, "astryx", -500, 99999);
  assert.ok(inside(w), "can't be dragged off the field");
});

test("tapping makes a pet hop; resizing keeps everyone inside", () => {
  const w = world(15);
  assert.ok(poke(w, "zyphira"));
  assert.ok(getPetState(w, "zyphira").hop > 0);
  assert.equal(poke(w, "nobody"), false);
  run(w, 3);
  resize(w, 320, 360);
  assert.ok(inside(w));
  run(w, 5);
  assert.ok(inside(w));
});

test("bad input is rejected; huge or zero time steps are safe", () => {
  assert.throws(() => createWorld({width: 0, height: 10, pets: out}), RangeError);
  assert.throws(() => createWorld({width: 10, height: 10, pets: [{id: "a"}, {id: "a"}]}), /Duplicate/);
  assert.throws(() => setAction(world(), "fly"), /Unknown action/);
  const w = world(16);
  step(w, 1e9); step(w, -5); step(w, NaN);
  assert.ok(inside(w));
  assert.equal(mulberry32(1)(), mulberry32(1)());
});

test("an empty playground works", () => {
  const w = createWorld({width: 400, height: 300, pets: []});
  for (const a of ACTIONS) { setAction(w, a); run(w, 1); }
  assert.equal(w.pets.length, 0);
});

// --- adding a pet's real animation ---
test("animation files are identified by content, not by name", () => {
  const bytes = s => Uint8Array.from(s, c => c.charCodeAt(0));
  assert.equal(sniffClipType(bytes("GIF89a......")), "image/gif");
  assert.equal(sniffClipType(bytes("\x89PNG\r\n\x1a\n")), "image/png");
  assert.equal(sniffClipType(bytes("RIFF....WEBPVP8 ")), "image/webp");
  assert.equal(sniffClipType(bytes("\0\0\0\x18ftypmp42")), "video/mp4");
  assert.equal(sniffClipType(bytes("\x1A\x45\xDF\xA3\x01")), "video/webm");
  assert.equal(sniffClipType(bytes("<svg onload=alert(1)>")), null);
  assert.equal(sniffClipType(bytes("MZ\x90\0")), null);
  assert.equal(checkClip(0, bytes("GIF89a")).ok, false);
  assert.equal(checkClip(MAX_CLIP_BYTES + 1, bytes("GIF89a")).ok, false);
  assert.deepEqual(checkClip(1000, bytes("GIF89a")), {ok: true, type: "image/gif"});
});

// --- page wiring ---
test("page: action buttons, no network calls, files kept on device", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const code = ["playground.mjs", "roam.mjs", "clips.mjs", "pets.mjs"].map(f => readFileSync(new URL("../" + f, import.meta.url), "utf8")).join("\n");
  for (const a of ACTIONS) assert.match(html, new RegExp('data-action="' + a + '"'));
  assert.match(html, /src="\.\/playground\.mjs"/);
  assert.doesNotMatch(code + html, /fetch\(|XMLHttpRequest|sendBeacon|WebSocket|https?:\/\/(?!www\.w3\.org)/);
  assert.match(code, /revokeObjectURL/);
  assert.ok(readFileSync(new URL("../rotation.html", import.meta.url), "utf8").includes("rotation.mjs"), "original page kept");
});
