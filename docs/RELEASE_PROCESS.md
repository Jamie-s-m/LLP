# Release process

This is the sequence actually used to take LinguaNest from a local branch to
live production (Phases 3-5 of this engagement), written down so another
engineer can repeat it without re-deriving it. Each step says whether it's
automatable, requires a human, or must never be automated - and what
rolling back looks like if it goes wrong.

| # | Step | Automatable? | Rollback |
|---|---|---|---|
| 1 | Reproduce and root-cause every issue on a local branch first - never fix blind | No - needs engineering judgment | N/A (nothing shipped yet) |
| 2 | Fix, and write/extend a regression test that fails on the original bug and passes after the fix | Partially - test running is automatic, writing the right test isn't | Revert the commit; the failing test itself proves what broke |
| 3 | Run the full local suite: backend `npm test`, backend `npx eslint src`, frontend `npm test -- run`, frontend `npm run lint`, frontend `npm run build` | Yes - already CI's `build-and-test` job | N/A |
| 4 | Run a broader security/consistency pass (auth/authz, IDOR, webhook signature verification, injection, secret leakage) before anything touching payments, auth, or admin surfaces ships | No - adversarial review needs a human or a dedicated review pass, not just the test suite | N/A |
| 5 | Get explicit human go-ahead before pushing to `main` - this repo has Render's native auto-deploy wired to `main`, so a push **is** a production deploy, not a staging step | **Must never be automated** - this is the one irreversible-adjacent gate in the whole sequence | Don't push until confirmed |
| 6 | If the release includes a database change (new index, content seed, migration), take a real backup first. `mongodump` may not be installed - a Node-based full-collection JSON export is an acceptable substitute; verify the manifest (collection count, document counts) before proceeding | Scriptable, but running it is a manual, deliberate step, not a hook | Restore from the backup export; every backup taken this way must be verified restorable in principle even if never actually restored |
| 7 | Dry-run the database change against production (read-only preview, zero writes) and read the output before proceeding | Scriptable (`content:seed:production -- --dry-run`), but must be read by a human before step 8 | N/A - it's read-only |
| 8 | Push to `main` | Yes, once step 5's approval is given | `git revert` the commit(s) and push again - Render's auto-deploy will redeploy the reverted state. Confirm no destructive migration already ran that a code revert alone can't undo |
| 9 | Confirm the deploy actually happened and is healthy - don't infer from "push succeeded". Check the Render API's deploy records for the commit, and hit `/api/health` | Yes - a script or curl check, but someone has to actually run and read it | If the deploy failed or the health check fails, Render can be rolled back to the previous successful deploy from its dashboard |
| 10 | Apply the database change for real (e.g. `content:seed:production` without `--dry-run`), immediately followed by the same read-only checks used in the dry run, plus a collection-by-collection diff against the pre-write backup on any collection the change wasn't supposed to touch | Scriptable, human-triggered | Restore the specific affected collections from the step-6 backup; this is why the backup must be taken *before* step 8, not after |
| 11 | Re-verify the specific things the release was supposed to fix, against real production data or a real production API call where it's safe to do so without side effects (e.g. a real correct/incorrect exercise submission, a real 400 on a forgery attempt) - not just "the test suite is green" | No - needs a human to decide what's safe to test live vs. what would create unwanted side effects (e.g. don't replay a real Payme or Click webhook against production) | N/A - these are read/verify actions |
| 12 | Update documentation that describes the deployed state (`DEPLOYMENT.md`, `PRODUCTION_READINESS.md`, `ARCHITECTURE.md` if behavior changed) in the same change, not as a follow-up that may never happen | Partially - drafting can be automated, accuracy-checking against real `package.json`/schema/API behavior needs a human | N/A |
| 13 | Record what happened - what shipped, what was verified live vs. only in tests, what was deliberately deferred and why - somewhere durable (a memory file, a report, a changelog). Silent success is indistinguishable from "nobody checked" | No | N/A |

## Never automate

- Step 5 (push-to-main approval) and step 8 (the push itself, absent that
  approval) - `main` auto-deploys, so this is the actual "go live" moment,
  not a formality.
- Any production database write without a preceding backup + dry-run on
  that specific change.
- Rotating or modifying secrets/credentials/service configuration via an
  automated agent acting on a user's behalf, even with credentials in hand
  - this stays a human-in-the-loop action regardless of what access is
    technically available.

## What CI actually covers vs. doesn't

`.github/workflows/ci-cd.yml`'s `build-and-test` job covers steps 3
(lint/test/build) automatically on every push and PR. It does **not**
cover steps 4, 5, 6, 7, 10, 11, or 13 - those require a human, real
production access, or judgment CI can't exercise. There is deliberately no
CI deploy job (see `docs/DEPLOYMENT.md`) - Render's native GitHub
auto-deploy handles step 8/9's mechanics once step 5 approves the push.
