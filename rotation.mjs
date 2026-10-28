export const INDEX_LISTED = Object.freeze([
  { id: "astryx", name: "Astryx", icon: "✦" },
  { id: "bramble", name: "Bramble", icon: "◆" },
  { id: "bramble-cosmic", name: "Bramble Cosmic", icon: "✧" },
  { id: "stardust", name: "Stardust", icon: "★" }
]);
export const PENDING_ASSETS = Object.freeze(["Aurelon", "Mochi", "Nexus"]);

export function localDayIndex(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError("Valid date required");
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
// Day number for the calendar date in America/Chicago (or another zone). DST-safe because it
// reads the wall-clock date in that zone instead of adding fixed 24-hour steps.
export function zonedDayIndex(date = new Date(), timeZone = "America/Chicago") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) throw new TypeError("Valid date required");
  const parts = {};
  for (const p of new Intl.DateTimeFormat("en-US", {timeZone, year: "numeric", month: "numeric", day: "numeric"}).formatToParts(date))
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86400000);
}
export function buildRotation(eligible, slotCount = 7, dayIndex = 0) {
  if (!Array.isArray(eligible)) throw new TypeError("Eligible pets must be an array");
  if (!Number.isInteger(slotCount) || slotCount < 1 || slotCount > 20) throw new RangeError("Invalid slot count");
  if (!Number.isInteger(dayIndex)) throw new TypeError("Day index must be an integer");
  const ids = eligible.map(p => p && p.id);
  if (ids.some(id => typeof id !== "string" || !id)) throw new TypeError("Every pet needs an id");
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate pet id");
  if (eligible.length === 0) return { slots: Array(slotCount).fill(null), benched: [] };
  const shift = ((dayIndex % eligible.length) + eligible.length) % eligible.length;
  const ordered = eligible.slice(shift).concat(eligible.slice(0, shift));
  const active = ordered.slice(0, slotCount);
  return { slots: active.concat(Array(slotCount - active.length).fill(null)), benched: ordered.slice(slotCount) };
}

// Only runs on the original rotation page (rotation.html), which has a #slots element.
if (typeof document !== "undefined" && document.querySelector("#slots")) {
  const slotHost = document.querySelector("#slots");
  const benchHost = document.querySelector("#bench");
  const dateHost = document.querySelector("#day");
  const toggle = document.querySelector("#motion");
  const result = buildRotation(INDEX_LISTED, 7, localDayIndex());
  dateHost.textContent = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  for (const [index, pet] of result.slots.entries()) {
    const item = document.createElement("article");
    item.className = pet ? "pet-card" : "pet-card vacant";
    const indexText = document.createElement("small");
    indexText.textContent = "SLOT " + String(index + 1).padStart(2, "0");
    item.append(indexText);
    const orb = document.createElement("span");
    orb.className = "orb";
    orb.setAttribute("aria-hidden", "true");
    orb.textContent = pet?.icon ?? "+";
    item.append(orb);
    const title = document.createElement("h3");
    title.textContent = pet?.name ?? "Awaiting asset";
    item.append(title);
    const status = document.createElement("p");
    status.textContent = pet ? "SIMULATED PREVIEW · real animation not installed" : "LOCKED · asset unverified";
    item.append(status);
    slotHost.append(item);
  }
  benchHost.textContent = result.benched.length ? result.benched.map(p => p.name).join(", ") : "None; fewer than eight eligible companions";
  toggle.addEventListener("click", () => {
    const moving = document.body.classList.toggle("moving");
    toggle.textContent = moving ? "Pause motion" : "Preview motion";
    toggle.setAttribute("aria-pressed", String(moving));
  });
}
