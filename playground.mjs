// Browser side of the playground: draws the pets, runs the animation loop, handles taps and drags.
import {PETS, getPet, petLook, artLabel} from "./pets.mjs";
import {dailyRotation, zonedDayIndex} from "./rotation.mjs";
import {createWorld, step, setAction, resize, poke, hold, release, modeOf, getPetState} from "./roam.mjs";
import {checkClip, saveClip, deleteClip, loadClips} from "./clips.mjs";

const $ = s => document.querySelector(s);
const field = $("#field"), cardEl = $("#card"), statusEl = $("#status"), rosterEl = $("#roster");
const BUBBLES = {sleep: "💤", rest: "💤", play: "✦", dance: "♪", protect: "🛡️", held: "❕", roam: ""};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};

const state = {
  day: null, world: null, els: new Map(), selected: null, paused: false,
  calm: store.get("pets-calm", reduceMotion.matches), forms: store.get("pets-forms", {}),
  clips: {}, clipUrls: {}, out: [], napping: []
};

function say(text) { statusEl.textContent = text; }

function lineup() {
  const now = new Date();
  const day = zonedDayIndex(now, "America/Chicago");
  const {slots, benched} = dailyRotation("preview", now);
  return {day, out: slots.filter(Boolean), napping: benched};
}

function sizePx() { return Math.round(Math.max(44, Math.min(72, Math.min(field.clientWidth, field.clientHeight) / 7))); }

function buildWorld() {
  const {day, out, napping} = lineup();
  state.day = day; state.out = out; state.napping = napping;
  state.world = createWorld({width: field.clientWidth, height: field.clientHeight, pets: out, resting: napping, seed: day});
  state.world.calm = state.calm;
  for (const el of state.els.values()) el.remove();
  state.els.clear();
  for (const p of state.world.pets) field.append(makePetEl(p.id));
  renderToday(); renderRoster(); renderCard();
}

function makePetEl(id) {
  const pet = getPet(id);
  const el = document.createElement("button");
  el.type = "button"; el.className = "pet"; el.dataset.id = id;
  el.innerHTML = '<span class="shadow"></span><span class="body"></span><span class="tag"></span><span class="bubble"></span>';
  state.els.set(id, el);
  paintPet(id);
  attachPointer(el, id);
  el.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(id, true); }
  });
  return el;
}

function paintPet(id) {
  const el = state.els.get(id); if (!el) return;
  const pet = getPet(id), look = petLook(pet, state.forms[id]);
  const body = el.querySelector(".body"), url = state.clipUrls[id];
  el.style.setProperty("--c", look.color);
  el.style.setProperty("--size", sizePx() + "px");
  el.querySelector(".tag").textContent = look.label;
  el.classList.toggle("has-clip", !!url);
  el.classList.toggle("selected", state.selected === id);
  body.replaceChildren();
  if (url) {
    const video = state.clips[id]?.type?.startsWith("video/");
    const media = document.createElement(video ? "video" : "img");
    media.src = url; media.alt = "";
    if (video) { media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; media.play?.().catch(() => {}); }
    body.append(media);
  } else {
    const g = document.createElement("span"); g.className = "glyph"; g.textContent = look.glyph; g.setAttribute("aria-hidden", "true");
    body.append(g);
  }
  labelPet(id);
}

function labelPet(id) {
  const el = state.els.get(id), p = getPetState(state.world, id); if (!el || !p) return;
  const mode = modeOf(state.world, p);
  const words = {sleep: "napping in the nest", rest: "resting", play: "playing", dance: "dancing", protect: "on guard", held: "being carried", roam: "roaming"};
  el.setAttribute("aria-label", petLook(getPet(id), state.forms[id]).label + ", " + words[mode]);
  el.classList.toggle("sleeping", p.sleeping);
}

// Drag to move; a short press without moving counts as a tap.
function attachPointer(el, id) {
  let start = null;
  const local = e => { const r = field.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    start = {x: e.clientX, y: e.clientY, dragging: false};
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener("pointermove", e => {
    if (!start) return;
    if (!start.dragging && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) start.dragging = true;
    if (start.dragging && !getPetState(state.world, id).sleeping) { const [x, y] = local(e); hold(state.world, id, x, y); }
  });
  const end = () => {
    if (!start) return;
    if (start.dragging) release(state.world, id); else select(id, true);
    start = null;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", () => { if (start?.dragging) release(state.world, id); start = null; });
  el.addEventListener("click", e => { if (e.detail === 0) select(id, true); }); // keyboard activation
}

function select(id, nudge) {
  const before = state.selected;
  state.selected = id;
  if (nudge) poke(state.world, id);
  if (before && before !== id) paintPet(before);
  paintPet(id); renderCard(); renderRoster();
}

function renderToday() {
  const date = new Intl.DateTimeFormat("en-US", {timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric"}).format(new Date());
  const nap = state.napping.map(p => p.name).join(", ");
  $("#today").textContent = date + " · Preview · " + state.out.length + " out playing" + (nap ? " · " + nap + " napping" : "");
  const hour = Number(new Intl.DateTimeFormat("en-US", {timeZone: "America/Chicago", hour: "numeric", hourCycle: "h23"}).format(new Date()));
  field.classList.toggle("day", hour >= 7 && hour < 19);
}

function renderRoster() {
  rosterEl.replaceChildren(...PETS.map(pet => {
    const li = document.createElement("li"), b = document.createElement("button");
    const look = petLook(pet, state.forms[pet.id]), napping = state.napping.some(p => p.id === pet.id);
    b.type = "button"; b.setAttribute("aria-pressed", String(state.selected === pet.id));
    b.innerHTML = '<span aria-hidden="true"></span><span><span class="n"></span><small></small></span>';
    b.firstChild.textContent = look.glyph;
    b.querySelector(".n").textContent = look.label;
    b.querySelector("small").textContent = (napping ? "Napping today · " : "") + (state.clipUrls[pet.id] ? "your clip" : "placeholder");
    b.addEventListener("click", () => select(pet.id, true));
    li.append(b); return li;
  }));
}

function renderCard() {
  const id = state.selected;
  if (!id) return;
  const pet = getPet(id), look = petLook(pet, state.forms[id]), hasClip = !!state.clipUrls[id];
  const napping = state.napping.some(p => p.id === id);
  cardEl.replaceChildren();
  const h = document.createElement("h2"); h.textContent = look.glyph + " " + look.label;
  const p1 = document.createElement("p"); p1.textContent = napping ? "Napping in the nest today — back out tomorrow." : "Out in the playground today.";
  const p2 = document.createElement("p"); p2.className = "muted"; p2.textContent = artLabel(pet, hasClip) + ". " + pet.note + ".";
  const row = document.createElement("div"); row.className = "row";
  if (pet.forms) for (const f of pet.forms) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = f.name + " form";
    b.setAttribute("aria-pressed", String((state.forms[id] || pet.forms[0].id) === f.id));
    b.addEventListener("click", () => { state.forms[id] = f.id; store.set("pets-forms", state.forms); paintPet(id); renderCard(); renderRoster(); say(look.label.split(" ")[0] + " switched to " + f.name + " form."); });
    row.append(b);
  }
  if (!napping) {
    const guard = document.createElement("button"); guard.type = "button"; guard.textContent = "🛡️ Everyone protect " + pet.name;
    guard.addEventListener("click", () => doAction("protect", id));
    row.append(guard);
  }
  const file = document.createElement("label"); file.className = "filebtn";
  file.innerHTML = '<input type="file" accept="image/gif,image/png,image/webp,video/mp4,video/webm,.gif,.png,.webp,.mp4,.webm"><span></span>';
  file.querySelector("span").textContent = hasClip ? "Replace its animation" : "Add its animation";
  file.querySelector("input").addEventListener("change", e => importClip(id, e.target));
  row.append(file);
  if (hasClip) {
    const rm = document.createElement("button"); rm.type = "button"; rm.textContent = "Remove animation";
    rm.addEventListener("click", () => removeClip(id));
    row.append(rm);
  }
  cardEl.append(h, p1, p2, row);
}

async function importClip(id, input) {
  const file = input.files?.[0]; input.value = "";
  if (!file) return;
  try {
    const verdict = checkClip(file.size, new Uint8Array(await file.slice(0, 16).arrayBuffer()));
    if (!verdict.ok) { say(verdict.reason); return; }
    const blob = file.type === verdict.type ? file : new Blob([file], {type: verdict.type});
    let persisted = true;
    await saveClip(id, blob).catch(() => { persisted = false; });
    setClip(id, blob);
    say(persisted ? getPet(id).name + " clip saved on this device; playback remains unverified."
      : "Clip preview only: could not save in this browser. It will be lost on reload.");
  } catch (err) { say("That file couldn't be used: " + err.message); }
}

async function removeClip(id) {
  try { await deleteClip(id); } catch {}
  setClip(id, null);
  say(getPet(id).name + " is back to its placeholder.");
}

function setClip(id, blob) {
  if (state.clipUrls[id]) URL.revokeObjectURL(state.clipUrls[id]);
  if (blob) { state.clips[id] = blob; state.clipUrls[id] = URL.createObjectURL(blob); }
  else { delete state.clips[id]; delete state.clipUrls[id]; }
  paintPet(id); renderCard(); renderRoster();
}

function doAction(action, focus = null) {
  setAction(state.world, action, focus);
  for (const b of document.querySelectorAll("[data-action]")) b.setAttribute("aria-pressed", String(b.dataset.action === action));
  const names = {roam: "Everyone's roaming free.", play: "Play time!", dance: "Dance party!", rest: "Everyone's settling down to rest.",
    protect: "Everyone's guarding " + (focus ? getPet(focus).name : getPet(state.world.pets[0].id).name) + "."};
  say(names[action]);
}

for (const b of document.querySelectorAll("[data-action]")) b.addEventListener("click", () => doAction(b.dataset.action, b.dataset.action === "protect" ? state.selected : null));
$("#pause").addEventListener("click", e => { state.paused = !state.paused; e.currentTarget.setAttribute("aria-pressed", String(state.paused)); e.currentTarget.textContent = state.paused ? "Resume" : "Pause"; say(state.paused ? "Paused." : "Back to it."); });
const calmBtn = $("#calm");
function applyCalm() { state.world.calm = state.calm; calmBtn.setAttribute("aria-pressed", String(state.calm)); }
calmBtn.addEventListener("click", () => { state.calm = !state.calm; store.set("pets-calm", state.calm); applyCalm(); say(state.calm ? "Calm motion on: slower walking, no bouncing." : "Calm motion off."); });

// Animation loop.
let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  if (!state.paused && !document.hidden) step(state.world, dt);
  const bounce = !state.calm;
  for (const p of state.world.pets) {
    const el = state.els.get(p.id); if (!el) continue;
    const moving = Math.hypot(p.vx, p.vy) > 6;
    let lift = 0;
    if (bounce && p.hop > 0) lift = Math.sin((p.hop / 0.6) * Math.PI) * 22;
    else if (bounce && moving) lift = Math.abs(Math.sin(p.phase)) * 5;
    else if (bounce && state.world.action === "dance" && !p.sleeping) lift = Math.abs(Math.sin(p.phase * 0.7)) * 12;
    el.style.transform = `translate3d(${p.x.toFixed(1)}px,${(p.y - lift).toFixed(1)}px,0)`;
    el.querySelector(".body").style.transform = `scaleX(${p.facing}) ${p.held ? "scale(1.12)" : ""}`;
    el.querySelector(".shadow").style.opacity = String(1 - lift / 40);
    const bubble = BUBBLES[modeOf(state.world, p)] ?? "";
    const bubbleEl = el.querySelector(".bubble");
    if (bubbleEl.textContent !== bubble) { bubbleEl.textContent = bubble; labelPet(p.id); }
  }
  requestAnimationFrame(frame);
}

new ResizeObserver(() => {
  if (!state.world) return;
  resize(state.world, field.clientWidth, field.clientHeight);
  for (const id of state.els.keys()) state.els.get(id).style.setProperty("--size", sizePx() + "px");
}).observe(field);

// New day in Central Time → new line-up.
setInterval(() => {
  renderToday();
  if (zonedDayIndex(new Date(), "America/Chicago") !== state.day) { buildWorld(); applyCalm(); say("A new day — the line-up has changed."); }
}, 60000);

buildWorld(); applyCalm();
requestAnimationFrame(t => { last = t; frame(t); });
loadClips().then(saved => { for (const [id, blob] of Object.entries(saved)) if (getPet(id)) setClip(id, blob); }).catch(() => {});
