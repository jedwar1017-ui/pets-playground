# @Pets Playground — working rotation prototype

**Status:** Browser prototype with simulated CSS/emoji companions. Not a released desktop pet, not connected to the private assets, and not a verified live seven-pet installation.

## What works in source
- Seven visible rotation slots per day, with empty slots clearly marked.
- A deterministic daily rotation and fair bench selection once more than seven eligible pets exist.
- Start/stop animation preview, responsive layout and reduced-motion support.
- A zero-dependency Node test suite for selection, empty slots and bench fairness.

## Evidence boundary
Past asset index entries identify Astryx, Bramble, Bramble-Cosmic and Stardust as candidates. This repository **does not contain their real art/animation files**. Aurelon, Mochi and Nexus remain pending/unverified. The visual circles and symbols are placeholders only.

## Run
Serve this directory with any local static server (e.g. `python -m http.server 8000`) and open http://localhost:8000. To test: Node 22+, `node --test tests/*.test.mjs`.

## Release gates
1. Obtain explicit approved asset files and licenses; do not upload private art to a public repository.
2. Add per-character animation manifests and verify each sprite/audio frame.
3. Test normal movement, idle, reloading, memory/performance and seven-slot schedule on the actual target OS.
4. Confirm rotation/persistence in a running app; do not claim GitHub file existence means installation.

No API keys, private media or personal data belong in this public repository.
