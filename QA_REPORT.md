# QA REPORT — @Pets Playground
Date: 2026-10-28

## Executed
- `node --test tests/*.test.mjs` on Node 22.23.4: **27/27 passed**. This covers the 7 original rotation tests plus 20 new ones: roster, Central Time day change across both DST switches, every pet napping once in 8 days, roaming bounds for every action, no NaN, determinism, no pile-ups, social play starting and ending, rest, the dance ring, protect, calm motion, drag, resize, bad input, empty field, and file-type checks.
- Headless Chromium (Playwright) at 1280×900 and 390×844, against a local static server:
  - 8 pets drawn and moving; no horizontal scroll; no page or console errors.
  - Clicking a pet opens its card. Dragging marks it "being carried". All five actions update the status line.
  - Keyboard: focusing a pet and pressing Enter opens its card.
  - Bramble's Cosmic form survives a reload.
  - A fake `.gif` is rejected. A real GIF is accepted and survives a reload (IndexedDB).
  - The original `rotation.html` still shows its 7 slots.
  - Screenshots were reviewed for clipping. Fixed: name tags were cut off at the bottom edge, and the dance ring was cramped on narrow screens.

## Not tested
- Safari, Firefox, real phones, touch dragging on a physical touchscreen, screen readers.
- Real pet artwork: no private files were used. Only a 1×1 test GIF.
- Long-running performance on low-end hardware.

**Release state: working browser playground with placeholder pets; real art is added per device by the owner.**
