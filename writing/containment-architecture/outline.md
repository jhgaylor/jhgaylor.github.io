# Outline v1: the containment architecture

Skeleton drafted 2026-08-14 from issue #17. Flagship-adjacent, the security cross-section of the estate-medic system. Companion posts: #11 (the merge gate, deep-dive on one gate) and #12 (the full loop, capstone walkthrough). Neither companion has shipped yet; if this ships first, describe the loop in one sentence and link the companions later, once each is live, at most once each.

**The question the post answers:** what has to be true, structurally, before you let an agent work production incidents?

**Thesis:** every path the agent has is the minimum one, and none of the containment comes from policies or prompts. Each property is enforced by GitHub, RBAC, or network topology. The agent doesn't have to be trusted, because it isn't trusted with anything.

**Grounding:** the estate-medic system on home-cloud, with behold-fountain-demo as the reproducible miniature (a "tuning" commit drops the db env block including the `secretKeyRef`; drift stays green, postgres crashloops; the fix re-references a Secret that never left the cluster).

Working title TBD. Issue title reads "The containment architecture: safely putting an agent on incident duty"; the subtitle shape may retire at draft time. Description candidate: "Eight structural properties, enforced by GitHub, RBAC, and network topology, that let an agent work production incidents without being trusted with anything."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- companion #11 post, if shipped (the merge gate section)
- companion #12 post, if shipped (intro, for the full loop)
- behold-fountain-demo repo (the incident section)
- candidates, trim to what earns a place: behold, fountain, chant (disclose BinaryBourbon as my agent-driven account wherever the bot identity first appears)

## 1. Intro (no header)

- Open on the question everyone is asking right now: before an agent touches production incidents, what has to be true? Not "what should it promise," what has to be *structurally* true.
- One-sentence sketch of the loop so the reader has a picture (alert fires, agent diagnoses through a read-only lens, opens a PR, human merges, Flux applies). Defer the full walkthrough to #12.
- Name the frame: defense in depth where every path is the minimum one. Hand off to the sections.

## 2. The incident that needs an agent (demo grounding)

- The break: a plausible tuning commit drops the env block feeding `POSTGRES_PASSWORD` from the in-cluster `db-credentials` Secret.
- Drift is green, health is red. Reconciliation is satisfied and the system is broken; that gap is what the agent fills.
- The fix is knowledge, not secret material. This fact is load-bearing for section 6: the whole incident class is fixable without any secret transiting the loop.
- Link behold-fountain-demo here as the runnable version.

## 3. Read path is a lens, not a shell

- The agent observes the estate only through behold behind a GET-only bearer proxy: 401 without the token, 405 on POST, real cert at behold-agent.inevitable.fyi.
- behold itself runs with a read-only ClusterRole: get/list/watch, `secrets` explicitly excluded.
- Two layers deep on the read path alone: even if the proxy failed open, the lens behind it cannot write and cannot read secrets.

## 4. Write path is git, and only git

- The agent runs as a non-admin bot collaborator (BinaryBourbon, my agent-driven GitHub account, disclosed). It can push branches and open PRs.
- The proof, not the promise: bot approving its own PR gets HTTP 422; bot merging its own PR gets HTTP 405. Required CI check on every PR.
- Enforced by GitHub, not by convention or code we wrote. Keep this section tight and point to #11 for the deep dive if it has shipped.

## 5. Apply path is Flux, and only Flux

- Agent proposes, human disposes, machine applies.
- No kubectl credentials anywhere near the agent. The only thing that reconciles the cluster is Flux, and Flux only reads merged main.

## 6. What holds nothing

- estate-dispatcher, the listening component, has zero cluster RBAC. It translates Alertmanager webhooks into fountain conversations holding nothing but one fountain API key.
- Secrets never transit the loop. The fix re-references an in-cluster Secret the agent cannot read (ClusterRole excludes secrets, section 3), never its value.
- Credential hygiene as architecture: dedicated scoped tokens per role (fine-grained contents:read PAT for repo-sync, dedicated fountain key, bot PAT), all vault-stored, all preflight-validated with `GET /user` before a run.

## 7. The human is paged in parallel, not replaced

- ntfy fires at every stage: firing, on-it, PR-ready, resolved. The agent can never be quietly on-call.
- The human holds the merge button (section 4) and gets the page anyway. Oversight is additive, not substitutive.

## 8. Bounded blast radius (closing)

- Enumerate the worst case honestly: a bad PR that a human declines. Walk it: the agent cannot apply (5), cannot merge (4), cannot write to the cluster (3), cannot exfiltrate secrets (3, 6).
- Land the thesis as the derived claim: none of these properties are prompts. Remove the model, swap the model, let the model be wrong; the containment doesn't move.
- Ender: concrete claim or directive, exact wording at draft time. No aphorism.

## Source material to pull into research.md

- home-cloud apps/behold: RBAC + proxy, PRs #62–#68 (exact ClusterRole verbs, proxy behavior, cert)
- home-cloud apps/estate-dispatcher: PRs #70–#72 (confirm zero-RBAC claim, what the webhook holds)
- home-cloud branch protection + bot identity: PRs #73–#74 (exact 422/405 responses, `require_last_push_approval`, required check name)
- agent-specs preflight (`GET /user` validation, vault layout for the scoped tokens)
- behold-fountain-demo README + scripts/break.sh (the incident mechanics)

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs ("not X. It's Y."), negation-reveal seesaws, recap openers, aphorism enders, bolded list leads.
- Each prior post and repo linked at most once. BinaryBourbon disclosed as agent-driven, never buried. chant is a friend's project, not mine, if it comes up. No current-Ravi claims.
- Verify at publish time: proxy still returns 401/405 as described, branch protection settings unchanged, `secrets` still excluded from the ClusterRole, preflight still validates via `GET /user`, whether #11/#12 posts shipped (fix links accordingly).
