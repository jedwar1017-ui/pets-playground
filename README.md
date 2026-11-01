# @Pets Playground

**Your pets, roaming free in one place.** Open `index.html` (served by any static web server) and the day's pets wander around a shared field, bump into each other, and sometimes start playing on their own.

## What you can do
- **Watch them roam.** Seven pets come out each day (Central Time) and one naps in the nap nest. The line-up shifts every day so everyone gets turns. Over eight days each pet naps exactly once.
- **Group actions:** 🌿 Roam · 🎾 Play (they pair up and chase) · 💫 Dance (a ring that fills the field) · 🛡️ Protect (everyone circles the pet you picked) · 🌙 Rest.
- **Click or tap a pet** to make it hop and see its card. **Drag a pet** to carry it somewhere else. Pets can also be picked from the keyboard (Tab, then Enter) or from the list.
- **Bramble's forms:** switch between Classic and Cosmic. Bramble Cosmic is a form of Bramble, not an extra pet.
- **Calm motion** (slower walking, no bouncing) turns on automatically if your system asks for reduced motion. **Pause** stops playground movement; imported media loops can continue.
- **Give a pet its real animation:** pick it, then use *Add its animation* to choose a GIF, PNG, WebP, MP4 or WebM (up to 25 MB). The file type is checked from the file's contents. The file is stored **in that browser on that device only**. It is never uploaded and is not in this repository.

## The pets
Aetherion, Bramble (Classic/Cosmic), Astryx, Stardust Nova, Zyphira, Mochi, Aurelon and Nexus. The list lives in `pets.mjs`, with what is known about each pet's real art.

## Honest limits
- Every pet is drawn as a coloured placeholder with an emoji until you add its animation on your device. Historical records locate private assets; this checkout does not verify their current contents. Aetherion and Nova claims come from issue #2, not the October 12 index alone. Unverified artwork does not mean nonexistent artwork.
- Added animations don't sync between devices or browsers, and clearing browser data removes them. Keep your originals.
- Animations play as one loop. There are no separate walk, play or dance clips per pet yet.
- Checked in desktop Chromium at desktop and narrow widths. It hasn't been checked in Safari, Firefox, or on a real phone.

## Files
- `index.html` + `playground.mjs`: the playground page.
- `roam.mjs`: the roaming engine (movement, pairing, group actions, no overlapping). Contains no page code, so it is tested in Node.
- `pets.mjs`: the pet list. `rotation.mjs`: the daily line-up. `clips.mjs`: file checks and on-device storage.
- `rotation.html`: the preserved rotation layout, now using the canonical roster, verified eligibility and Chicago date.
- `digital-landscape/`: separate notes, unchanged.

## Run and test
Run `python -m http.server 8000`, then open http://localhost:8000. Tests need Node 22+ and no installs: `node --test tests/*.test.mjs`.

No API keys, private art or personal data belong in this public repository.

## Consolidation contract
The root application on `main` is authoritative: `index.html` → `playground.mjs`;
`pets.mjs` owns identities, forms and evidence; `rotation.mjs` owns both daily
schedules. The shared-field playground explicitly uses preview eligibility (all
eight characters). `rotation.html` uses verified eligibility (currently none),
leaving seven empty slots. Neither page certifies pets as live.

Bramble Cosmic is a form, never an extra rotation slot. Stardust archive contents
must be mapped to specific Nova files before verification; Zyphira stays distinct.
Asset records distinguish historical provenance, version, format validation,
frame count, target-runtime playback, installation, states and pair synchronization.
Device imports do not promote these records. Header sniffing is not full decoding.

PR #3 is an incomplete historical source snapshot, not a build dependency. Its
JavaScript ends mid-function at line 200. Do not merge it into this implementation.
The root app needs no Vite build or dependencies. Preserve `digital-landscape/`.
See `CONSOLIDATION_REVIEW.md` for remaining verification gates.
