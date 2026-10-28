const PETS = [
  {
    id: 'aetherion',
    name: 'Aetherion',
    glyph: '⚡',
    source: '24-frame lightning GIF located',
  },
  {
    id: 'bramble',
    name: 'Bramble',
    glyph: '🐉',
    source: 'Classic + Cosmic GIFs located',
  },
  {
    id: 'astryx',
    name: 'Astryx',
    glyph: '🌌',
    source: 'Transformation GIF located',
  },
  {
    id: 'stardust-nova',
    name: 'Stardust Nova',
    glyph: '✨',
    source: 'Nova GIFs located',
  },
  {
    id: 'zyphira',
    name: 'Zyphira',
    glyph: '🦊',
    source: 'Sprite reference only',
  },
  { id: 'mochi', name: 'Mochi', glyph: '🦎', source: 'Animation not verified' },
  {
    id: 'aurelon',
    name: 'Aurelon',
    glyph: '🐲',
    source: 'Animation not verified',
  },
  { id: 'nexus', name: 'Nexus', glyph: '🔮', source: 'Animation not verified' },
];
const START = Date.UTC(2026, 9, 25);
const dayParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const state = {
  future: 0,
  paired: false,
  action: 'rest',
  selected: localStorage.getItem('pets-selected') || 'aetherion',
  partner: '',
  media: {},
  clips: {},
};
const id = name => document.getElementById(name);
const app = id('app');
app.innerHTML = [
  '<div class="shell"><header><div><div class="kicker">STARDUST UNIVERSE · MOBILE CONTROL</div><h1>@Pets <em>Playground</em></h1><p class="subtitle">Daily companions · Seven slots · Two-pet collaboration</p></div><span class="status">Private browser animations</span></header>',
  '<section class="panel"><div class="headrow"><h2>✨ Pet interaction stage</h2><span id="today-label" class="muted"></span></div><div class="stage" id="stage"><div id="main-pet" class="pet"></div><span id="between" class="versus" hidden>✦</span><div id="partner-pet" class="pet hidden"></div></div><div class="controls"><label class="toggle"><input id="pair-toggle" type="checkbox"> Two pets together</label><select id="partner-select" aria-label="Choose companion" hidden></select></div><div class="controls" id="actionbar"><button class="btn primary" data-action="play">🎾 Play</button><button class="btn" data-action="protect">🛡️ Protect</button><button class="btn" data-action="dance">💫 Dance</button><button class="btn" data-action="rest">🌙 Rest</button></div><div class="notice" id="interaction-status" role="status" aria-live="polite">Select a pet to begin. Interactions are choreography previews until real action clips are linked.</div></section>',
  '<section class="panel"><div class="headrow"><h2>📅 Seven daily pet slots</h2><button id="preview-day" class="btn ghost">Preview tomorrow</button></div><div class="stats"><span id="active-count" class="stat"></span><span id="clip-count" class="stat"></span><span class="stat">Central Time rotation</span></div><div id="roster" class="roster" aria-label="Daily pet rotation"></div><div class="bench"><strong>Benched today:</strong><span id="bench-list"></span></div><p class="note">Every day the queue advances. With eight registered pets, seven appear and one rests. Missing animations remain clearly labeled.</p></section>',
  '<section class="panel"><h2>📱 Add an animation from your phone</h2><div class="filebox"><label for="clip-target">Pet</label><select id="clip-target" aria-label="Choose pet to receive animation"></select><button id="pick-file" class="btn primary">Import GIF or MP4</button><input id="file-input" type="file" accept=".gif,.mp4,image/gif,video/mp4" hidden></div><div id="upload-status" class="notice" role="status" aria-live="polite">Choose an animated GIF or MP4 saved in Files on your phone.</div><p class="hint">Files are stored in this browser on this device, not uploaded to GitHub or a server. Browser storage can be cleared; keep your original files in your private Library. Imported clips show as previews, not certified animation-state packs.</p><div id="asset-list"></div></section>',
  '<footer>Build 1 · Character identities and art preserved. Public cloud page contains code and placeholders only; private character artwork is not included. GitHub/Library automatic asset sync and real cross-character animation event clips are not yet installed.</footer></div>',
].join('');
const savedBundled = window.PETS_BUNDLED_ASSETS || {};
function texasDay(offset = 0) {
  const p = {};
  dayParts.formatToParts(new Date()).forEach(v => {
    if (v.type !== 'literal') p[v.type] = Number(v.value);
  });
  return (
    Math.floor((Date.UTC(p.year, p.month - 1, p.day) - START) / 86400000) +
    offset
  );
}
function labelDate(offset = 0) {
  const p = {};
  dayParts.formatToParts(new Date()).forEach(v => {
    if (v.type !== 'literal') p[v.type] = Number(v.value);
  });
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(Date.UTC(p.year, p.month - 1, p.day + offset)));
}
function schedule(offset = 0) {
  const start = ((texasDay(offset) % PETS.length) + PETS.length) % PETS.length;
  const active = Array.from(
    { length: Math.min(7, PETS.length) },
    (_, i) => PETS[(start + i) % PETS.length]
  );
  const set = new Set(active.map(p => p.id));
  return { active, benched: PETS.filter(p => !set.has(p.id)) };
}
function getPet(pid) {
  return PETS.find(p => p.id === pid) || PETS[0];
}
function clip(pid) {
  return state.media[pid] || savedBundled[pid] || null;
}
function clipDescription(pid) {
  return state.media[pid]
    ? 'Device clip imported'
    : savedBundled[pid]
      ? 'Packaged animation loaded'
      : 'Preview placeholder — no clip loaded';
}
function makePet(pid) {
  const pet = getPet(pid);
  const media = clip(pid);
  const shell = document.createElement('div');
  shell.className = 'orb';
  if (media) {
    let el;
    if ((state.clips[pid] || '').startsWith('video/')) {
      el = document.createElement('video');
      el.muted = true;
      el.loop = true;
      el.autoplay = true;
      el.playsInline = true;
    } else el = document.createElement('img');
    el.src = media;
    el.className = 'avatar';
    el.setAttribute('aria-label', pet.name + ' imported animation');
    if (el.tagName === 'VIDEO') el.play().catch(() => {});
    shell.appendChild(el);
  } else {
    const span = document.createElement('span');
    span.className = 'symbol';
    span.textContent = pet.glyph;
    shell.appendChild(span);
  }
  const caption = document.createElement('strong');
  caption.textContent = pet.name;
  const details = document.createElement('span');
  details.className = 'source';
  details.textContent = clipDescription(pid);
  return [shell, caption, details];
}
function renderStage() {
  const daily = schedule(state.future).active;
  if (!daily.some(p => p.id === state.selected)) state.selected = daily[0].id;
  const primary = id('main-pet');
  primary.replaceChildren(...makePet(state.selected));
  const options = daily.filter(p => p.id !== state.selected);
  if (!options.some(p => p.id === state.partner))
    state.partner = options[0]?.id || '';
  id('partner-select').replaceChildren(
    ...options.map(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.name;
      return o;
    })
  );
  id('partner-select').value = state.partner;
  id('partner-select').hidden = !state.paired;
  id('between').hidden = !state.paired;
  const secondary = id('partner-pet');
  secondary.classList.toggle('hidden', !state.paired);
  if (state.paired && state.partner)
    secondary.replaceChildren(...makePet(state.partner));
  else secondary.replaceChildren();
  id('pair-toggle').checked = state.paired;
}
function renderRoster() {
  const plan = schedule(state.future);
  const grid = id('roster');
  grid.replaceChildren();
  plan.active.forEach((pet, index) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot' + (pet.id === state.selected ? ' selected' : '');
    b.setAttribute(
      'aria-pressed',
      pet.id === state.selected ? 'true' : 'false'
    );
    b.setAttribute('aria-label', 'Slot ' + (index + 1) + ': ' + pet.name);
    const num = document.createElement('small');
    num.textContent = 'SLOT ' + (index + 1);
    const glyph = document.createElement('span');
    glyph.className = 'glyph';
    glyph.textContent = pet.glyph;
    const name = document.createElement('span');
    name.className = 'slotname';
    name.textContent = pet.name;
    const status = document.createElement('span');
    status.className = 'clip';
    status.textContent = clip(pet.id) ? '● clip loaded' : '○ needs clip';
    b.append(num, glyph, name, status);
    b.addEventListener('click', () => {
      state.selected = pet.id;
      localStorage.setItem('pets-selected', pet.id);
      render();
      notice('Featured pet changed to ' + pet.name + '.');
    });
    grid.appendChild(b);