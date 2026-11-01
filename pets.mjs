// Canonical @Pets roster: one list for the playground, the rotation and the tests.
// Identity decisions come from issue #2; evidence sources and dates are explicit below.
// "art" says what is known about each pet's real artwork. None of it is in this public repo:
// in the playground every pet is a placeholder until the owner imports a clip on their own device.

export const ART = Object.freeze({
  LOCATED: "private-files-located",   // historical records locate files; not current playback proof
  REFERENCE: "reference-only",        // design reference, no animation file yet
  PENDING: "not-verified"             // named, but no artwork confirmed
});

export const PETS = Object.freeze([
  {id: "aetherion", name: "Aetherion", glyph: "⚡", color: "#f5c542", speed: 1.25, art: ART.LOCATED,
    note: "Issue #2 reports a 24-frame lightning GIF; not independently verified here"},
  {id: "bramble", name: "Bramble", glyph: "🐉", color: "#4fc98b", speed: 0.9, art: ART.LOCATED,
    note: "Walk and transformation GIFs in the private library",
    forms: Object.freeze([{id: "classic", name: "Classic"}, {id: "cosmic", name: "Cosmic", glyph: "🌠", color: "#8f6bff"}])},
  {id: "astryx", name: "Astryx", glyph: "🌌", color: "#6aa8ff", speed: 1, art: ART.LOCATED,
    note: "Transformation GIF in the private library"},
  {id: "stardust-nova", name: "Stardust Nova", glyph: "✨", color: "#ff9ad5", speed: 1.1, art: ART.LOCATED,
    note: "Issue #2 reports Nova GIFs; October 12 Stardust archive needs per-file mapping"},
  {id: "zyphira", name: "Zyphira", glyph: "🦊", color: "#ff8a4c", speed: 1.3, art: ART.REFERENCE,
    note: "Celestial fox; sprite reference only"},
  {id: "mochi", name: "Mochi", glyph: "🦎", color: "#9be15d", speed: 0.8, art: ART.PENDING,
    note: "October 12 index lists no files; current artwork unverified"},
  {id: "aurelon", name: "Aurelon", glyph: "🐲", color: "#e0b84f", speed: 0.95, art: ART.PENDING,
    note: "October 12 index lists no files; current artwork unverified"},
  {id: "nexus", name: "Nexus", glyph: "🔮", color: "#b48cff", speed: 0.85, art: ART.PENDING,
    note: "No artwork confirmed"}
].map(p => Object.freeze({...p,
  forms: p.forms && Object.freeze(p.forms.map(f => Object.freeze(f))),
  assets: Object.freeze((p.forms || [{id: "default"}]).map(f => Object.freeze({
    formId: f.id,
    provenance: Object.freeze({
      record: ["astryx", "bramble", "mochi", "aurelon", "nexus"].includes(p.id)
        ? "private-asset-index:2026-10-12" : "repository-issue:2:2026-10-28",
      scope: p.id === "stardust-nova" ? "Nova file mapping pending; Stardust archive is broader" : p.note
    }),
    located: p.art === ART.LOCATED,
    // Historical location is independent of validation in a target runtime.
    fileVersion: null, formatValidated: false, frameCount: null,
    playbackVerified: false, runtimeInstalled: false, targetRuntime: null,
    states: Object.freeze([]), pairSynchronizationVerified: false
  })))
})));

export function getPet(id) {
  return PETS.find(p => p.id === id) || null;
}

// Look of a pet in a given form (Bramble Cosmic is a form of Bramble, not a separate pet).
export function petLook(pet, formId) {
  const form = pet.forms?.find(f => f.id === formId);
  return {glyph: form?.glyph ?? pet.glyph, color: form?.color ?? pet.color,
    label: form && form.id !== pet.forms[0].id ? pet.name + " " + form.name : pet.name};
}

export function artLabel(pet, hasDeviceClip) {
  if (hasDeviceClip) return "Your clip (stored on this device only)";
  if (pet.art === ART.LOCATED) return "Placeholder — private files reported; playback unverified";
  if (pet.art === ART.REFERENCE) return "Placeholder — design reference only";
  return "Placeholder — artwork unverified";
}

// Conservative eligibility: locating or importing a clip never certifies installation.
// Multiple verified forms still produce only one eligible pet.
export function eligiblePets(mode = "verified", roster = PETS) {
  if (!["preview", "verified"].includes(mode)) throw new RangeError("Unknown rotation mode");
  return mode === "preview" ? roster.slice() : roster.filter(p => p.assets?.some(a =>
    a.fileVersion && a.formatValidated === true && Number.isInteger(a.frameCount) && a.frameCount > 1 &&
    a.playbackVerified === true && a.runtimeInstalled === true &&
    typeof a.targetRuntime === "string" && a.targetRuntime.trim()
  ));
}
