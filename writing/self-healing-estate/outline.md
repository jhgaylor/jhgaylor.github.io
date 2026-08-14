# Outline v1: the self-healing estate, end to end

Skeleton drafted 2026-08-14 from issue #12. Flagship capstone, third in sequence after drift-green-health-red (#10) and git-is-the-apply-path (#11). Diagram-heavy, postmortem style: written as the timeline of one real incident, with the architecture explained at each hop. Companions: #13 (rehearsals), #17 (containment).

**Thesis:** a full incident loop, break through heal, runs with the laptop out of the loop and a human on exactly one button. Alert fires, an agent diagnoses through a read-only lens, opens a two-line PR, a human merges, Flux heals, the incident closes itself, and the human was paged at every stage.

**The loop (spine of the post, one section per hop):** break → Flux applies the bad-but-green commit → crashloop → Prometheus → Alertmanager → estate-dispatcher → fountain conversation → estate-medic agent reads live state via behold behind a GET-only proxy → diagnosis → minimal PR as the BinaryBourbon bot → human approves and merges → Flux heals → watcher closes the incident. ntfy pages the human in parallel throughout (firing / on-it / PR-ready / resolved).

**Form:** postmortem framing. Timestamps from the 2026-08-13 mealie rehearsal if they hold up, or a clean run re-executed for the post. Each hop gets: what fired, what it holds (credentials, RBAC), what it handed to the next hop. One master loop diagram near the top, referenced throughout; consider small per-hop excerpts if the master gets dense.

Working title: issue title is long ("The self-healing estate, end to end"). The permalink slug can stay `self-healing-estate`. Description candidate: "One broken commit, one alert, one agent-authored PR, one human merge, one healed cluster. A full walkthrough of the incident loop, hop by hop, with the laptop out of the loop."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once, this post has the most candidates so budget hard):

- drift-green-health-red post (the break, section 2)
- git-is-the-apply-path post (the merge gate, section 6)
- containment post (#17) if shipped (the security cross-section, closing)
- rehearse post (#13) if shipped (closing, how the loop got hardened)
- behold repo (the lens hop)
- fountain repo (the agent hop)
- Cut list ready: if all companions ship first, that's four post links plus repos; drop the weakest rather than linking everything.

## 1. Intro (no header)

- Open mid-postmortem: timestamp zero, a plausible commit merges green. Timestamp N minutes, the database is healed by a PR the on-call human merged from their phone. The post replays everything between.
- State the two constraints the architecture holds: the laptop is out of the loop (everything runs in-cluster or in managed services), and the human is paged in parallel, never replaced.
- Place the master loop diagram here.

## 2. The break (compressed)

- The bad-but-green commit and the crashloop, three or four sentences total; drift-green-health-red owns this topic, link it here.
- What matters for this post: Flux applied it, because Flux applies everything on main. The same pipe that broke it will heal it.

## 3. Detection: crashloop to page

- Prometheus sees the crashloop; stock Alertmanager rules were too slow for a demo cadence (15m), so a custom ~30s `EstateWorkloadDown` rule drives detection. Note honestly what's demo-tuned versus what production would keep.
- First ntfy page fires: "firing." The human knows before the agent does anything.

## 4. Dispatch: webhook to conversation

- estate-dispatcher, the whole hop in one breath: a tiny ConfigMap-mounted Node webhook that dedupes by fingerprint, opens incidents, closes them on resolve.
- The property worth a paragraph: zero cluster RBAC. It holds one fountain API key and translates Alertmanager webhooks into fountain conversations. Nothing else.

## 5. Diagnosis: the agent and its lens

- estate-medic wakes up in a fountain conversation. Its view of the world is behold behind a GET-only bearer proxy at behold-agent.inevitable.fyi; read-only ClusterRole underneath, secrets excluded. One sentence each; the containment post owns the depth.
- The diagnosis itself, shown concretely: live estate state (crashloop, missing env) correlated with git history (the tuning commit) lands on the root cause.
- Second ntfy page: "on-it."

## 6. The fix: a two-line PR and one button

- The PR: a two-line root-cause revert, source and generated output together, opened by the BinaryBourbon bot (my agent-driven GitHub account, disclosed).
- The gate in two sentences: branch protection means the bot provably cannot approve or merge its own PR; the human's merge is the apply decision. Link git-is-the-apply-path for the proof.
- Third ntfy page: "PR-ready," with an actionable review push. The phone-merge beat lands here.

## 7. Heal and close

- Flux reconciles main, the pod comes up, the watcher sees health return and closes the incident. Fourth page: "resolved."
- Tally the loop: what each hop held (dispatcher: one API key; agent: a read-only lens and a bot PAT; Flux: the only kubectl in the story) and what the human did (read three pages, pressed one button).

## 8. Closing

- What generalizes and what doesn't, stated honestly: the 30s alert rule is demo cadence; the architecture, an agent with read-only eyes and a git-only pen, is the part to keep.
- Point sideways once each, if shipped: the rehearsals that hardened this loop (#13), the full security cross-section (#17).
- Ender: concrete claim or directive, exact wording at draft time. No aphorism.

## Diagram plan

- Master: the loop as a left-to-right pipeline with the human lane drawn in parallel (ntfy arrows crossing down at each stage), the cluster boundary drawn explicitly so "laptop out of the loop" is visible.
- Optional per-hop insets for sections 4–6 if the master alone can't carry the credential annotations.
- Source of truth: the loop diagram in home-cloud docs/estate-medic.md; redraw for the site rather than screenshotting.

## Source material to pull into research.md

- home-cloud docs/estate-medic.md (full runbook + loop diagram)
- home-cloud apps/estate-dispatcher (confirm zero-RBAC claim, fingerprint dedupe, ConfigMap mount)
- home-cloud apps/behold + custom-alerts.yaml (proxy details, `EstateWorkloadDown` rule text)
- Rehearsal notes and timestamps from the 2026-08-13 live mealie run (decide: real timestamps or clean re-run)
- The actual two-line diff of the fix PR, quoted verbatim in section 6

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs, negation-reveal seesaws, recap openers, aphorism enders, bolded list leads. Postmortem headers are prone to "X, not Y" shapes; check headers too.
- Each post and repo linked at most once; this post is the hub, so enforce the cut list. BinaryBourbon disclosed as agent-driven. chant attributed to its author if mentioned. No current-Ravi claims.
- Verify at publish time: alert rule name and cadence, dispatcher still zero-RBAC, ntfy stage names (firing / on-it / PR-ready / resolved), which companions shipped (fix links accordingly).
