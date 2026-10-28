# Codex migration staging area

**Status: source transferred for review, not merged, not deployed from GitHub.**

## Read first
- Root `README.md`, `rotation.mjs`, `tests/`, `QA_REPORT.md`
- `digital-landscape/` is separate work: preserve unchanged
- [Issue #2](https://github.com/jedwar1017-ui/pets-playground/issues/2) has the full acceptance criteria
- `codex-import/appdeploy-mobile/` is a **snapshot** of the separately hosted phone app from AppDeploy, app ID `stardust-pets-playground-kf8shw`, version `1792931638043`
- Hosted reference: https://stardust-pets-playground-kf8shw.v2.appdeploy.ai/

## Setup
On Codex Cloud, select the repo and this branch and examine BOTH implementations. The `codex-import/appdeploy-mobile` folder is a self-contained Vite app. Its `tests/tests.json` is an AppDeploy UI test specification, not executable Node tests. Node 22+ is recommended.

```sh
cd codex-import/appdeploy-mobile
npm install
npm run build
```

The above commands have **not been executed as part of this handoff**. Do not claim the build passed until Codex runs them and records output.

## Safe project unification
1. Run the root Node tests and baseline the existing GitHub rotation behavior.
2. Build/check the imported mobile app separately.
3. Compare code paths and reconcile one canonical roster/rotation engine, keeping the original files and tests until a proven replacement is reviewed.
4. Implement pairing and shared choreography, not a claim of real per-character movements without actual animation-state assets.
5. Add phone-browser/manual iOS checks, 7-slot rotation fairness, one benched each day when eight pets are eligible, DST/day transition, state persistence, missing assets and reduced-motion.
6. Report observed results and create further changes only on a feature branch/draft PR; no automatic merge or deployment.

## Private asset warning
This repository is PUBLIC. **No personal images, animations, archives, private Drive links, keys, or binary media should be committed here.** All private pet files remain in protected ChatGPT Library/Google Drive until the owner explicitly approves a secure upload destination. Assets indexed elsewhere are not installed in this repository.

## Key identity decisions
- Universe: Stardust. The fox is **Zyphira** (not another character named Stardust).
- Stardust Nova remains distinct.
- Bramble-Cosmic is a form of Bramble, not a separate pet.
- Unverified: Aurelon, Mochi, Nexus, and any character whose art exists but does not yet have validated playable animation.

## Evidence
The imported AppDeploy phone app was reported **ready** with no recorded frontend/network errors on its hosting check; this does NOT certify iOS Safari operation, character animation playback, secure asset sync, or full multi-pet motion.
