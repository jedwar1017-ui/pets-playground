# @Pets Playground

**Your pets, roaming free in one place.** Open `index.html` (served by any static web server) and the day's pets wander around a shared field, bump into each other, and sometimes start playing on their own.

## What you can do
- **Watch them roam.** Seven pets come out each day (Central Time) and one naps in the nap nest. The line-up shifts every day so everyone gets turns. Over eight days each pet naps exactly once.
- **Group actions:** 🌿 Roam · 🎾 Play (they pair up and chase) · 💫 Dance (a ring that fills the field) · 🛡️ Protect (everyone circles the pet you picked) · 🌙 Rest.
- **Click or tap a pet** to make it hop and see its card. **Drag a pet** to carry it somewhere else. Pets can also be picked from the keyboard (Tab, then Enter) or from the list.
- **Bramble's forms:** switch between Classic and Cosmic. Bramble Cosmic is a form of Bramble, not an extra pet.
- **Calm motion** (slower walking, no bouncing) turns on automatically if your system asks for reduced motion. **Pause** stops everything.
- **Give a pet its real animation:** pick it, then use *Add its animation* to choose a GIF, PNG, WebP, MP4 or WebM (up to 25 MB). The file type is checked from the file's contents. The file is stored **in that browser on that device only**. It is never uploaded and is not in this repository.

## The pets
Aetherion, Bramble (Classic/Cosmic), Astryx, Stardust Nova, Zyphira, Mochi, Aurelon and Nexus. The list lives in `pets.mjs`, with what is known about each pet's real art.

## Honest limits
- Every pet is drawn as a coloured placeholder with an emoji until you add its animation on your device. Real art for Aetherion, Bramble, Astryx and Stardust Nova exists in your private files. Zyphira has a design reference only. Mochi, Aurelon and Nexus have no finished art yet.
- Added animations don't sync between devices or browsers, and clearing browser data removes them. Keep your originals.
- Animations play as one loop. There are no separate walk, play or dance clips per pet yet.
- Checked in desktop Chromium at desktop and narrow widths. It hasn't been checked in Safari, Firefox, or on a real phone.

## Files
- `index.html` + `playground.mjs`: the playground page.
- `roam.mjs`: the roaming engine (movement, pairing, group actions, no overlapping). Contains no page code, so it is tested in Node.
- `pets.mjs`: the pet list. `rotation.mjs`: the daily line-up. `clips.mjs`: file checks and on-device storage.
- `rotation.html`: the original rotation prototype, kept as it was.
- `digital-landscape/`: separate notes, unchanged.

## Run and test
Run `python -m http.server 8000`, then open http://localhost:8000. Tests need Node 22+ and no installs: `node --test tests/*.test.mjs`.

No API keys, private art or personal data belong in this public repository.
