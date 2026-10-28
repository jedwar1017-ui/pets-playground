// Roaming engine for the @Pets playground. Pure data + math: no DOM, so it runs in Node tests.
// Pets wander a rectangular field, avoid overlapping, sometimes start playing with a neighbour,
// and can be told to Play, Dance, Protect or Rest together.

export const ACTIONS = Object.freeze(["roam", "play", "dance", "protect", "rest"]);
const MAX_DT = 0.1;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const scaleOf = w => Math.max(0.6, Math.min(1.6, Math.min(w.width, w.height) / 420));
const margin = w => 30 * scaleOf(w);
const bottomMargin = w => 54 * scaleOf(w); // room for the name tag under each pet
const between = (rng, lo, hi) => lo + rng() * (hi - lo);

// pets: [{id, speed}] that are out today; resting: [{id}] sitting the day out (they sleep in the nest).
export function createWorld({width, height, pets, resting = [], seed = 1}) {
  if (!(width > 0 && height > 0)) throw new RangeError("Field needs a positive size");
  const ids = [...pets, ...resting].map(p => p?.id);
  if (ids.some(id => typeof id !== "string" || !id)) throw new TypeError("Every pet needs an id");
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate pet id");
  const world = {width, height, rng: mulberry32(seed), action: "roam", focus: null, calm: false, t: 0, spin: 0, pets: []};
  const m = margin(world);
  for (const p of pets) {
    world.pets.push({id: p.id, speed: p.speed > 0 ? p.speed : 1, x: between(world.rng, m, width - m),
      y: between(world.rng, m, height - bottomMargin(world)), vx: 0, vy: 0, tx: null, ty: null, pause: world.rng() * 1.5,
      facing: world.rng() < 0.5 ? -1 : 1, social: null, hop: 0, held: false, sleeping: false, phase: world.rng() * 6.28});
  }
  // Nappers sit on the nap nest drawn in the bottom-right of index.html.
  resting.forEach((p, i) => {
    world.pets.push({id: p.id, speed: 0, x: width - 85 - i * 50 * scaleOf(world), y: height - bottomMargin(world), vx: 0, vy: 0,
      tx: null, ty: null, pause: 0, facing: -1, social: null, hop: 0, held: false, sleeping: true, phase: 0});
  });
  return world;
}

export function getPetState(world, id) {
  return world.pets.find(p => p.id === id) || null;
}

// What a pet is doing right now (for labels and animation).
export function modeOf(world, pet) {
  if (pet.sleeping) return "sleep";
  if (pet.held) return "held";
  if (world.action === "roam" && pet.social) return "play";
  return world.action;
}

export function setAction(world, action, focusId = null) {
  if (!ACTIONS.includes(action)) throw new Error("Unknown action: " + action);
  world.action = action;
  world.focus = focusId && getPetState(world, focusId) && !getPetState(world, focusId).sleeping ? focusId : null;
  for (const p of world.pets) { p.social = null; p.tx = p.ty = null; p.pause = 0; }
}

export function resize(world, width, height) {
  if (!(width > 0 && height > 0)) return;
  const sx = width / world.width, sy = height / world.height;
  world.width = width; world.height = height;
  for (const p of world.pets) { p.x *= sx; p.y *= sy; p.tx = p.ty = null; }
  clampAll(world);
}

// Tap a pet: it hops and, if roaming, heads somewhere new.
export function poke(world, id) {
  const p = getPetState(world, id);
  if (!p) return false;
  if (p.sleeping) { p.hop = 0.4; return true; }
  p.hop = 0.6; p.pause = 0; p.tx = p.ty = null;
  return true;
}

export function hold(world, id, x, y) {
  const p = getPetState(world, id);
  if (!p) return;
  p.held = true; p.x = x; p.y = y; p.vx = p.vy = 0;
  clamp(world, p);
}
export function release(world, id) {
  const p = getPetState(world, id);
  if (!p) return;
  p.held = false; p.tx = p.ty = null; p.pause = 0.3;
}

function activePets(world) { return world.pets.filter(p => !p.sleeping); }

// Where each pet wants to be for group actions.
function formationTargets(world) {
  const pets = activePets(world), s = scaleOf(world);
  const cx = world.width / 2, cy = world.height / 2;
  const targets = new Map();
  if (world.action === "dance") {
    const {rx, ry, cy: ringY} = danceRing(world), spin = world.spin;
    pets.forEach((p, i) => {
      const a = spin + (i / pets.length) * Math.PI * 2;
      targets.set(p.id, [cx + Math.cos(a) * rx, ringY + Math.sin(a) * ry]);
    });
  } else if (world.action === "protect") {
    const centre = getPetState(world, world.focus) || pets[0];
    if (!centre) return targets;
    const ox = Math.min(Math.max(centre.x, cx - 40 * s), cx + 40 * s), oy = Math.min(Math.max(centre.y, cy - 40 * s), cy + 40 * s);
    const guards = pets.filter(p => p !== centre), r = 70 * s;
    targets.set(centre.id, [ox, oy]);
    guards.forEach((p, i) => {
      const a = (i / Math.max(1, guards.length)) * Math.PI * 2;
      targets.set(p.id, [ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
    });
  } else if (world.action === "play") {
    // Pair up neighbours; each pair chases round its own midpoint.
    for (let i = 0; i < pets.length; i += 2) {
      const a = pets[i], b = pets[i + 1];
      if (!b) { targets.set(a.id, [a.x + Math.cos(world.t * 2) * 30 * s, a.y + Math.sin(world.t * 2) * 30 * s]); continue; }
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, ang = world.t * 2.4, r = 38 * s;
      targets.set(a.id, [mx + Math.cos(ang) * r, my + Math.sin(ang) * r]);
      targets.set(b.id, [mx - Math.cos(ang) * r, my - Math.sin(ang) * r]);
    }
  }
  return targets;
}

// The dance ring fills the field as an ellipse, so it isn't cramped on narrow screens.
export function danceRing(world) {
  const top = margin(world), bottom = world.height - bottomMargin(world);
  return {rx: (world.width / 2 - margin(world)) * 0.8, ry: (bottom - top) / 2 * 0.8, cy: (top + bottom) / 2};
}

function steer(world, p, tx, ty, speed, dt) {
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  const want = d < 4 ? 0 : Math.min(speed, d * 3);
  const vx = d ? (dx / d) * want : 0, vy = d ? (dy / d) * want : 0;
  const k = Math.min(1, dt * 4);
  p.vx += (vx - p.vx) * k; p.vy += (vy - p.vy) * k;
  return d;
}

export function step(world, dt) {
  dt = Math.min(MAX_DT, Math.max(0, Number(dt) || 0));
  if (!dt) return world;
  world.t += dt;
  world.spin += dt * 0.25 * (world.calm ? 0.45 : 1);
  const s = scaleOf(world), m = margin(world), rng = world.rng;
  const base = 55 * s * (world.calm ? 0.45 : 1);
  const targets = formationTargets(world);
  const pets = activePets(world);

  for (const p of world.pets) {
    p.hop = Math.max(0, p.hop - dt);
    p.phase += dt * (p.sleeping ? 1 : 6);
    if (p.sleeping || p.held) { p.vx = p.vy = 0; continue; }
    const speed = base * p.speed;

    if (world.action === "rest") {
      p.vx *= Math.max(0, 1 - dt * 3); p.vy *= Math.max(0, 1 - dt * 3);
    } else if (world.action !== "roam") {
      const [tx, ty] = targets.get(p.id) || [p.x, p.y];
      steer(world, p, tx, ty, speed * (world.action === "play" ? 1.7 : world.action === "dance" ? 2.2 : 1.3), dt);
    } else if (p.social) {
      p.social.left -= dt;
      const friend = getPetState(world, p.social.with);
      if (p.social.left <= 0 || !friend || friend.held || friend.social?.with !== p.id) { p.social = null; p.pause = 0.8; continue; }
      const mx = (p.x + friend.x) / 2, my = (p.y + friend.y) / 2, ang = world.t * 2.6 + (p.id < friend.id ? 0 : Math.PI);
      steer(world, p, mx + Math.cos(ang) * 30 * s, my + Math.sin(ang) * 30 * s, speed * 1.7, dt);
    } else {
      if (p.pause > 0) {
        p.pause -= dt; p.vx *= Math.max(0, 1 - dt * 5); p.vy *= Math.max(0, 1 - dt * 5);
      } else {
        if (p.tx === null) {
          const reach = Math.min(world.width, world.height) * 0.45;
          p.tx = Math.min(world.width - m, Math.max(m, p.x + between(rng, -reach, reach)));
          p.ty = Math.min(world.height - bottomMargin(world), Math.max(m, p.y + between(rng, -reach, reach) * 0.7));
        }
        const d = steer(world, p, p.tx, p.ty, speed, dt);
        if (d < 8) { p.tx = p.ty = null; p.pause = between(rng, 0.6, 3); }
      }
      // Sometimes two free pets that bump into each other start playing.
      if (!world.calm) for (const q of pets) {
        if (q === p || q.social || q.held || p.social) continue;
        if (Math.hypot(q.x - p.x, q.y - p.y) < 70 * s && rng() < dt * 0.12) {
          const left = between(rng, 3, 6);
          p.social = {with: q.id, left}; q.social = {with: p.id, left};
        }
      }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (Math.abs(p.vx) > 4) p.facing = p.vx > 0 ? 1 : -1;
  }
  separate(world);
  clampAll(world);
  return world;
}

// Gently push overlapping pets apart so they never stack on top of each other.
function separate(world) {
  const min = 46 * scaleOf(world), list = world.pets;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d >= min) continue;
    if (d < 0.001) { dx = 1; dy = 0; d = 1; }
    const push = (min - d) / 2, ux = dx / d, uy = dy / d;
    const aFixed = a.held || a.sleeping, bFixed = b.held || b.sleeping;
    if (aFixed && bFixed) continue;
    const ka = aFixed ? 0 : bFixed ? 2 : 1, kb = bFixed ? 0 : aFixed ? 2 : 1;
    a.x -= ux * push * ka; a.y -= uy * push * ka;
    b.x += ux * push * kb; b.y += uy * push * kb;
  }
}

function clamp(world, p) {
  const m = margin(world);
  p.x = Math.min(world.width - m, Math.max(m, p.x));
  p.y = Math.min(world.height - bottomMargin(world), Math.max(m, p.y));
}
function clampAll(world) { for (const p of world.pets) clamp(world, p); }
