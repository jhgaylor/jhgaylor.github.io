# Outline v1: git is the apply path

Skeleton drafted 2026-08-14 from issue #11. Flagship post, the most opinionated and shareable take in the series. Second in sequence, after drift-green-health-red (#10). Companions: #12 (the full loop), #17 (containment, which covers this gate as one of eight properties; this post is the deep dive).

**Thesis:** the obvious design for "human approves the agent's fix" is approval machinery, Temporal gates, ApplyOps, workers. We deleted the problem instead. The agent's PR is the proposal, the human's merge is the gate, Flux reconcile is the apply. The gate is enforced by GitHub's branch protection, not by convention or by code we wrote, and the proof is two HTTP status codes.

**The story arc:** this is a design-decision narrative, not a feature tour. Open with the machinery we almost built, show the realization that git already is an approval system with audit log and enforcement attached, then prove the gate holds against the agent itself.

Working title: issue title is "Git is the apply path." Also in play: something off the "making the human gate structural, not ceremonial" subtitle, or the "best code is code you didn't write" angle. Description candidate: "The agent opens the PR, the human merges it, Flux applies it. How branch protection turned an approval-machinery problem into two HTTP error codes."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- drift-green-health-red post (intro, the incident class that puts an agent in the loop at all)
- containment post (#17) if shipped, as the wider frame
- candidates: GitHub branch-protection docs for `require_last_push_approval`; fountain repo if the agent platform needs a pointer

## 1. Intro (no header)

- One paragraph of setup: an agent that diagnoses incidents and proposes fixes (link #10 for why), and the question of how a human stays between the proposal and the cluster.
- The design fork, honestly told: the first sketch was approval machinery, a Temporal gate parking a workflow, an ApplyOp, a worker holding credentials. Every piece of it is code we would own, secure, and debug at 2am.

## 2. The deletion

- The realization: we already run an approval system with identity, review, audit log, and enforcement. Every fix the agent can make is a source change, so the merge button *is* the approval gate.
- The three-role split, one line each: agent proposes (PR), human disposes (merge), machine applies (Flux reconcile of main). No role holds a second role's credential.
- What got deleted with the machinery: no approval service to page about, no worker with kubectl credentials, no state machine to desync from GitHub's.

## 3. Making the gate structural

- The bot identity: the agent runs as BinaryBourbon (my agent-driven GitHub account, disclosed as such), a non-admin collaborator with Write. It can push branches and open PRs, full stop.
- Branch protection carrying the load: 1 approving review, `require_last_push_approval` so the reviewer must be someone other than the last pusher, required "validate" check, stale reviews dismissed on new pushes.
- Spell out why `require_last_push_approval` is the load-bearing setting: without it, a bot with Write and a second account's stale approval could merge its own follow-up push.

## 4. The proof, not the promise

- Run the attacks as the bot and show the wire: approving its own PR returns HTTP 422; merging its own PR returns HTTP 405 "requires approval from someone other than the last pusher." Quote the actual responses.
- The point to land: these are GitHub's refusals, not ours. No prompt says "don't merge your own PR." Remove the prompt, swap the model, the gate doesn't move.
- Contrast with the ceremonial version in one or two sentences: a convention ("the agent won't merge") or a code check we wrote would be a promise; this is a property.

## 5. The human's side of the gate

- `enforce_admins=false`: the human admin bypasses freely when needed, and even then `gh pr merge` demands an explicit `--admin` flag, so the bypass is deliberate, never ambient.
- The asymmetry stated plainly: the agent cannot escalate past the gate, the human can, and the flag makes the escalation visible in the transcript.
- Supporting detail if it fits: the agent's read path is GET-only behold, so even reconnaissance is one-directional (one sentence, the containment post owns this topic).

## 6. Closing

- The general claim, sized honestly: when the agent's output is a source change, you inherit review, identity, history, and enforcement from infrastructure that predates the agent by a decade. Best code is code you didn't write; render that idea in fresh words, banned-shape-free.
- Ender: concrete claim or directive. Candidate direction: before building an approval gate for an agent, check whether the merge button already is one. No aphorism.

## Source material to pull into research.md

- home-cloud branch protection setup + PRs #73/#74 (exact settings JSON, exact 422/405 response bodies, required check name)
- agent-specs bot vault (how the bot PAT is scoped and stored, for one sentence in section 3)
- GitHub docs URL for `require_last_push_approval` (verify current behavior description)
- `gh pr merge --admin` behavior (verify the flag is still required with `enforce_admins=false`)

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs (high risk in the "promise vs property" beats of sections 4 and 6), negation-reveal seesaws, recap openers, aphorism enders, bolded list leads.
- Each post and repo linked at most once. BinaryBourbon disclosed as agent-driven at first mention, never buried. No current-Ravi claims.
- Verify at publish time: branch protection settings unchanged, 422/405 reproduce, `--admin` flag still required, which companion posts shipped (fix links accordingly).
