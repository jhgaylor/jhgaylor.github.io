# Outline v1: the demo video is a build artifact

Skeleton drafted 2026-08-14 from issue #15. Mid-size post about reproducible recording of a live multi-system demo, instead of screen-record-and-pray. Standalone; pairs naturally with self-healing-estate (#12), whose loop is the thing being filmed.

**Thesis:** when a demo spans a cluster, GitHub, an alerting stack, and an agent platform, no human can produce a clean take twice. The only reliable path is to make the recording a program: a purpose-built dashboard the camera watches, a Playwright script that performs the human role on cue, and a post pipeline that cuts and narrates deterministically. Run it again, get the same video.

**Second thread, don't lose it:** the dashboard is a UI designed for an *audience* rather than an operator. Different constraints (legible at a glance from a paused frame, quiet baseline so change reads as event, causality drawn as geometry) produce a different design than any ops dashboard.

**Form:** pipeline walkthrough in take order: the page the camera sees, the server feeding it, the robot performing the take, the post-processing. Screenshots or stills from the actual recording throughout.

Working title: issue title "The demo video is a build artifact" is the claim and likely survives. Description candidate: "A dashboard designed for the camera, a Playwright script that plays the human, and a narration mix keyed to timestamps. How a demo spanning four live systems gets a clean take every time."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- behold-fountain-demo repo (the pipeline lives in scripts/record-prod/)
- self-healing-estate post if shipped (one sentence for what the demo shows; this post is about filming it, not the loop itself)
- candidates: resume-is-a-deploy (kindred everything-is-a-build-artifact thesis) if it earns the sentence; Playwright docs probably don't need a link

## 1. Intro (no header)

- Open with the failure mode: a live demo across four systems (a k8s cluster, GitHub, an alerting stack, an agent platform), where a clean take requires every system to hit its cue in sequence, and any flub means resetting all of them. Screen record and pray does not survive contact with take two.
- The reframe in one sentence: treat the video like anything else worth reproducing, as the output of a build.

## 2. A page designed for the camera

- `index-prod.html`, the star of the shoot: story pipeline across the top, two cause-and-effect columns (change flows to estate, alert flows to agent) with drawn connectors, a glowing human gate at the merge moment.
- The audience-vs-operator design argument, this post's most transferable idea: an operator UI optimizes for scanning density and drill-down; a camera UI optimizes for a viewer who gets one glance at a moving frame. Quiet baseline so the eye goes where change happens, causality drawn as geometry so the viewer never has to infer an arrow.
- A still of the dashboard here, ideally the healed frame next to the firing frame.

## 3. One server, four systems, zero credentials on camera

- `server-prod.mjs` composes four live sources into that one page: change (GitHub), estate (kubectl), signals (ntfy alerts + review), agent (fountain).
- The design point: the server holds all credentials, so the recorded browser is unauthenticated. Nothing sensitive can appear on camera because nothing sensitive is *available* to the camera; no token in a URL bar, no cookie, no blur-in-post.

## 4. A robot performs the take

- `record-prod.mjs`: Playwright drives the browser through the take. It waits through a 40s review beat, performs the approve and squash-merge as the human, and auto-stops when the estate heals.
- Two beats to dwell on: the pacing is scripted (the review pause exists for the viewer, a real human would merge too fast to film), and the ending is event-driven, the recording stops when the cluster is healthy, not when a timer guesses it should.
- Honest edge: the demo is live, so take length varies with the cluster's actual healing time; the script rides the events instead of fighting them.

## 5. Post-processing without a human in the edit

- ffmpeg 4x speedup, then `narrate-and-mix.mjs` lays a narration track from timed JSON. The narration is data, so a re-recorded take re-narrates without re-editing.
- The payoff restated concretely: change the dashboard, rerun one command, ship a new video. The video is versioned by the same commits as the demo it films.

## 6. Closing

- The generalization, sized honestly: this is worth building when the demo is (a) multi-system and (b) needed more than once, which describes most launch demos and every demo that outlives one meeting.
- The audience-UI idea gets its closing sentence alongside the reproducibility one.
- Ender: concrete directive, exact wording at draft time. No aphorism.

## Source material to pull into research.md

- behold-fountain-demo scripts/record-prod/ (server-prod.mjs, index-prod.html, record-prod.mjs, shot.mjs, EXECUTION-PLAN.md) — confirmed present 2026-08-14
- The design mockup artifact linked from the repo notes (for the section 2 design story; check what's public before linking)
- Stills or frames from an actual recording (recordings/ dir in the repo) for sections 2 and 4
- Verify the numbers: 40s review beat, 4x speedup, the four source names as listed

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs (high risk in the operator-vs-audience beats of section 2), negation-reveal seesaws, recap openers, aphorism enders, bolded list leads.
- Each post and repo linked at most once. The demo repo lives under BinaryBourbon, my agent-driven GitHub account; disclose that at the repo's first mention. No current-Ravi claims.
- Verify at publish time: script names and flow unchanged in record-prod/, the mockup artifact link is public and stable, whether #12 shipped (fix link accordingly).
