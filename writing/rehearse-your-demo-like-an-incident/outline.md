# Outline v1: rehearse your demo like an incident

Skeleton drafted 2026-08-14 from issue #13. Mid-size post, the meta-story of the series: dry-run rehearsals of the healing loop kept flushing real bugs, and the demo rig quietly became a reliability tool. Reads standalone; sequencing flexible, any time after self-healing-estate (#12) gives it the most context.

**Thesis:** rehearsing a demo end to end is a game day. Every full rehearsal of the healing loop found a production bug the loop itself would have hit during a real incident, and one fix (the token preflight) immediately caught a second latent failure in an environment nobody was looking at.

**Form:** three war stories in escalating order of generality, then the turn: the scaffolding stopped being scaffolding. Keep it tight; the stories carry the post, the moral gets two paragraphs at most.

Working title: issue title "Rehearse your demo like an incident" is strong and directive; likely survives. Description candidate: "Three dry runs of the incident-healing loop, three real bugs flushed out before any real incident. What demo rehearsal has in common with a game day."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- self-healing-estate post if shipped (intro, the loop being rehearsed)
- candidates: first-credential-cant-be-a-secret or secrets-have-names if the vault-PAT story earns a sideways link; at most one

## 1. Intro (no header)

- Open with the plan: before recording the demo, run the whole healing loop for real, break to heal, several times. Treat each run like an incident with a transcript.
- The surprise worth the post: the rehearsals weren't validating the demo, they were debugging production. One sentence pointing at the loop itself (link #12 if shipped) and then straight into story one.

## 2. The dead token nobody could see

- Beat one: an agent run silently stalled. Root cause, a dead vault PAT; nothing failed loudly, the run just never went anywhere.
- The fix: a GitHub-token preflight in the apply script, validating any `*GITHUB_TOKEN*` secret via `GET /user` before upsert.
- The payoff that makes this the lead story: the preflight immediately caught a second dead token in a different environment, one that three other environments depended on. A bug found by the fix for the bug found by the rehearsal.
- Land the claim from the issue: the token preflight alone paid for the whole exercise.

## 3. The false page

- Beat two: a Flux reconcile wave paged 5 healthy Kustomizations. Alert storm with nothing wrong.
- The fix: the watcher grew a debounce, `DEBOUNCE_POLLS=2`. Two sentences on why debouncing at the watcher beats tuning the alert: transient reconcile states are a fact of Flux, not a threshold problem.
- The generalizable point: false pages found in rehearsal are false pages that never train a human to ignore the real one.

## 4. The command that never returns

- Beat three: `flux reconcile kustomization` hangs forever when a health check is failing by design, which in this loop it always is at break time.
- The fix: the break script grew 30s timeouts. Small fix, but the shape matters: the tooling assumed convergence, and an incident is precisely non-convergence. Anything in the loop that waits for health must be told how long to wait.

## 5. The turn: scaffolding becomes a reliability tool

- Name what happened across the three stories: the demo rig (break script, watcher, apply script) started as staging for a recording and ended as the estate's game-day harness. Every rehearsal hardened the production loop it was rehearsing.
- The transferable practice, stated concretely: if a system claims to handle incidents, schedule fake ones and run them end to end, transcript on. The bugs live in the seams that only a full run crosses (auth at rest, alert transients, tools that assume health).
- Ender: concrete directive, exact wording at draft time. Candidate direction: break it on purpose this week, before it breaks on schedule. Check against the aphorism gate; if it reads as a bumper sticker, replace with the specific next action.

## Source material to pull into research.md

- agent-specs scripts/apply.mjs (the preflight: exact matching rule for `*GITHUB_TOKEN*`, `GET /user` call, upsert ordering)
- home-cloud watcher script (`DEBOUNCE_POLLS=2` context) and break scripts (the 30s timeouts)
- Rehearsal notes 2026-08-12 (timeline of the three discoveries; confirm which rehearsal surfaced which bug)
- The second dead token story: confirm which environment and the three dependents, described without leaking anything private

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs (high risk in the section 5 turn), negation-reveal seesaws, recap openers, aphorism enders (section 6 ender is the danger spot), bolded list leads.
- Each post linked at most once. Nothing private from rehearsal notes; environment names only if already public in home-cloud. No current-Ravi claims.
- Verify at publish time: preflight still validates via `GET /user`, `DEBOUNCE_POLLS` default still 2, timeout still 30s, whether #12 shipped (fix intro link accordingly).
