// Optional: let the owner give a pet its real animation on their own device.
// The file is checked, then kept in this browser's IndexedDB. It is never uploaded anywhere.

export const MAX_CLIP_BYTES = 25 * 1024 * 1024;

// Identify the file by its first bytes, not by its name.
export function sniffClipType(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "image/gif";
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") return "video/mp4";
  if (b.length > 4 && ascii(0, 4) === "\x1A\x45\xDF\xA3") return "video/webm";
  return null;
}

export function checkClip(size, headBytes) {
  if (!(size > 0)) return {ok: false, reason: "That file is empty."};
  if (size > MAX_CLIP_BYTES) return {ok: false, reason: "That file is over 25 MB. Try a smaller GIF or video."};
  const type = sniffClipType(headBytes);
  if (!type) return {ok: false, reason: "Use a GIF, PNG, WebP, MP4 or WebM file."};
  return {ok: true, type};
}

const DB = "pets-playground", STORE = "clips";
function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function run(mode, fn) {
  return open().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode), out = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(out?.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  }));
}
export const saveClip = (petId, blob) => run("readwrite", s => s.put(blob, petId));
export const deleteClip = petId => run("readwrite", s => s.delete(petId));
export async function loadClips() {
  const out = {};
  await run("readonly", s => {
    const req = s.openCursor();
    req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
    return req;
  });
  return out;
}
