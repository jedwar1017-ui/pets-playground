// Canonical @Pets roster: one list for the playground, the rotation and the tests.
// Names and IDs come from the private asset index and the phone (AppDeploy) build.
// "art" says what is known about each pet's real artwork. None of it is in this public repo:
// in the playground every pet is a placeholder until the owner imports a clip on their own device.

export const ART = Object.freeze({
  LOCATED: "private-files-located",   // files exist in the owner's private library
  REFERENCE: "reference-only",        // design reference, no animation file yet
  PENDING: "not-verified"             // named, but no artwork confirmed
});

export const PETS = Object.freeze([
  {id: "aetherion", name: "Aetherion", glyph: "⚡", color: "#f5c542", speed: 1.25, art: ART.LOCATED,
    note: "24-frame lightning GIF in the private handoff pack"},
  {id: "bramble", name: "Bramble", glyph: "🐉", color: "#4fc98b", speed: 0.9, art: ART.LOCATED,
    note: "Walk and transformation GIFs in the private library",
    forms: Object.freeze([{id: "classic", name: "Classic"}, {id: "cosmic", name: "Cosmic", glyph: "🌠", color: "#8f6bff"}])},
  {id: "astryx", name: "Astryx", glyph: "🌌", color: "#6aa8ff", speed: 1, art: ART.LOCATED,
    note: "Transformation GIF in the private library"},
  {id: "stardust-nova", name: "Stardust Nova", glyph: "✨", color: "#ff9ad5", speed: 1.1, art: ART.LOCATED,
    note: "Nova GIFs in the private library"},
  {id: "zyphira", name: "Zyphira", glyph: "🦊", color: "#ff8a4c", speed: 1.3, art: ART.REFERENCE,
    note: "Celestial fox; sprite reference only"},
  {id: "mochi", name: "Mochi", glyph: "🦎", color: "#9be15d", speed: 0.8, art: ART.PENDING,
    note: "Adult rebuild folder is still empty"},
  {id: "aurelon", name: "Aurelon", glyph: "🐲", color: "#e0b84f", speed: 0.95, art: ART.PENDING,
    note: "Design folder is still empty"},
  {id: "nexus", name: "Nexus", glyph: "🔮", color: "#b48cff", speed: 0.85, art: ART.PENDING,
    note: "No artwork confirmed"}
].map(p => Object.freeze(p)));

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
  if (pet.art === ART.LOCATED) return "Placeholder — real art is in your private files";
  if (pet.art === ART.REFERENCE) return "Placeholder — design reference only";
  return "Placeholder — artwork not made yet";
}
