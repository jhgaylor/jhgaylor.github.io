# Outline v1: drift is green, health is red

Skeleton drafted 2026-08-14 from issue #10. Flagship post, the thesis of the behold × fountain demo, and first in the series (it stands alone; everything else hangs off it). Companions: #11 (the merge gate), #12 (the full loop), #17 (containment).

**Thesis:** GitOps reconciliation heals exactly one failure class, cluster diverging from source. A commit that is plausible, green, and wrong lands in a class reconciliation cannot see: the cluster matches source exactly and the system is broken. Closing that gap requires knowledge, not machinery, and that is the honest case for an agent in the loop.

**The hook:** a "tuning" commit right-sizes postgres memory and accidentally drops the container's env block, taking the `secretKeyRef` that feeds `POSTGRES_PASSWORD` from the in-cluster `db-credentials` Secret with it. After it ships the way green CI would (server-side apply, chant's own field manager):

- Drift is green. The cluster matches source exactly; `chant apply` is a no-op, and a reconcile would happily PR the broken state back to you.
- Health is red. Postgres refuses to start without a superuser password; the pod crashloops.

Working title: "Drift is green, health is red" likely survives, it is the whole post in six words. Watch that the subtitle doesn't become a contrast-pair sentence in disguise; the title states two facts, the prose must not seesaw them. Description candidate: "A plausible commit ships green, the cluster matches source exactly, and the database is down. The failure class GitOps reconciliation can't see, and why it takes knowledge to fix."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- behold-fountain-demo repo (the runnable version)
- chant repo (disclose it's a friend's project I use, not mine, if the framing invites the question)
- candidates: agent-ready-infrastructure or new-kind-of-computer if the closing gestures at the agent thesis; pick at most one

## 1. Intro (no header)

- Open inside the incident: the commit message reads "perf(db): right-size postgres for the demo cluster." The diff bumps a memory limit and tidies the container spec. It reviews clean, ships green, and the database goes down.
- Establish both dashboard readings side by side: drift green, health red. The reader should feel the wrongness of both being true at once before any theory arrives.

## 2. What reconciliation actually promises

- Reconciliation's contract, stated precisely: converge the cluster to source. It has no opinion about whether source is any good.
- The demo's mechanics as proof: the break ships via server-side apply under chant's own field manager, so afterwards the cluster matches source byte for byte. `chant apply` is a no-op. A reconcile would PR the broken state back to you.
- Name the class: self-heal covers cluster-diverges-from-source; nothing in the loop covers source-is-wrong-and-applied. Everyone has shipped a member of this class; anchor with the reader's own memory before the demo's.

## 3. Why this break is invisible

- The specific mechanism: the env block that dies carries a `secretKeyRef`, a *reference* to a Secret that lives only in the cluster. Removing a reference is syntactically boring; nothing lints it, CI stays green, the diff reads as tidying.
- The crashloop detail: postgres refuses to start without a superuser password. Health signal fires minutes after the merge that caused it, long after the pipeline stopped watching.
- Sharp edge worth one paragraph if it fits: a stale scaled-to-zero ReplicaSet matching the broken template gets re-adopted and progress tracking never restarts, so the estate reads "progressing" forever instead of degraded (from break.sh). Evidence that even the *detection* of this class is subtle. Cut if it drags.

## 4. The fix is knowledge, not secret material

- Walk the fix: re-add the env block referencing `db-credentials`. Two lines. The Secret never left the cluster and nothing in the fix contains a secret value.
- What the fixer needed: the current estate state (crashloop, missing env), the git history (the tuning commit), and the understanding that the reference, not the resource, went missing. Reading, correlating, proposing. Nothing that requires hands on the cluster.
- This is the job description an agent can hold. Land it as a claim about the shape of the work, not a product pitch. The loop that does this end to end is its own post (#12); one forward-looking sentence, link only if shipped.

## 5. Closing

- Restate the class boundary as the takeaway: keep reconciliation for drift, and know that green drift tells you nothing about health. The gap between them is staffed by whoever can carry knowledge, human or agent.
- Ender: concrete directive, exact wording at draft time. Candidate direction: run your own break.sh against your own estate and see which dashboards stay green. No aphorism.

## Source material to pull into research.md

- behold-fountain-demo README + scripts/break.sh (already read 2026-08-14: perl env-block strip, memory flip for a plausible diff, server-side apply with `chant:behold-k3d-demo` field manager, stale-RS deletion)
- home-cloud scripts/break-mealie-db.sh (the production version; confirm it matches the demo's mechanics before claiming it does)
- Exact `chant apply` no-op output for section 2 if a run is cheap

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs (high risk in this post, the title is a paired structure), negation-reveal seesaws, recap openers, aphorism enders, bolded list leads.
- Each post and repo linked at most once. chant attributed to its author, never claimed. No current-Ravi claims.
- Verify at publish time: break.sh still works as described, `chant apply` still no-ops after the break, which companion posts have shipped (fix forward links accordingly).
