# Consolidation review — 2026-10-29

## Authoritative source
Base: `08b0fbf38ad794bd2578673fea4dbb880bae4358` on main, the merge of PR #4.
Root `index.html` → `playground.mjs`; `pets.mjs` owns the roster and per-form
asset evidence; `rotation.mjs` owns scheduling; `roam.mjs` owns choreography;
`clips.mjs` owns device-local storage. `digital-landscape/` is unchanged.
PR #3 stays an unmerged historical import. Its 200-line JavaScript ends inside
`renderRoster`; the incomplete Vite snapshot is not a dependency or build target.

## Fixed
- One roster: Bramble Cosmic is a form; Zyphira and Stardust Nova remain distinct.
- Both pages use one Chicago/DST-safe schedule. The shared-field preview includes
  all eight registered characters; verified rotation leaves unverified slots empty.
- Historical provenance is separate from version, format/frame verification,
  target-runtime playback, installation, animation states and pair synchronization.
  Importing media never promotes a pet to verified eligibility.
- Removed claims that unverified art does not exist. October 12 evidence is dated;
  Aetherion/Nova claims reference issue #2. Nova still needs exact file mapping.
- Failed browser storage no longer gets overwritten by a misleading success message.

## Remaining evidence gates
These do not prevent review of this source-only change, but prevent a live claim:
1. In a protected workspace, inspect a versioned real asset (start with Astryx),
   validate full decoding/frame count, and map its identity/form. Preserve originals.
2. On the intended runtime, import that clip, verify playback and reload, then test
   missing/corrupt media, storage failure, reduced motion and sustained performance.
3. For synchronized character actions, supply state-specific frames and verify
   paired timing/transitions. Moving two independent loops is only choreography.
4. PR #4 says phone-specific scope was dropped; issue #2 still lists iOS. This
   change makes no iOS claim. Actual iPhone Safari/touch/accessibility testing remains
   required before offering iPhone support, irrespective of narrow desktop tests.
5. No server upload is introduced. Device-local import avoids a public asset upload;
   any later server delivery requires an explicitly approved protected destination.

Do not merge/deploy automatically or close PR #3 as part of this change.
