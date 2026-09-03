---
layout: layouts/blog.html
tags: ["posts"]
title: "The self-healing estate, end to end"
og_image: /images/og/self-healing-estate.jpg
description: "One broken commit, one agent-authored PR, one human merge, and one healed cluster"
permalink: /blog/posts/self-healing-estate/
date: 2026-09-02
---

A wrong commit lands on `main`. Flux applies it in about 15 seconds. The workload starts crashlooping while every drift check stays green.

About two minutes later, an agent opens a fix PR. It has inspected the cluster's state, found the root cause, and written the smallest repair it can. It has no cluster credentials. It cannot approve or merge the PR. That last edge belongs to me.

I call the agent `estate-medic`, and this is the incident loop running in my [home cloud](https://github.com/jhgaylor/home-cloud).

<figure class="wide-figure">
  <div class="wide-figure-scroll">
    <img src="/images/estate-medic-loop.svg" alt="A bad commit travels through Flux to a failed workload and Prometheus. Alertmanager sends the incident to a phone and a dispatcher. The dispatcher starts an agent, which reads the estate through Behold and opens a fix PR. Human approval closes the loop back to main.">
  </div>
  <figcaption>Detection to an open PR takes about two minutes. The break travels across the top, the response returns along the bottom, and the amber approval edge belongs to a human.</figcaption>
</figure>

## The wrong state that reconciliation approves

Flux repairs drift. Its contract is to make the cluster match the source in Git, and it keeps that contract even when the source is wrong.

The failure that proved this drops a `secretKeyRef` from a Deployment. Kubernetes accepts the manifest. CI stays green. Flux applies it and reports a clean reconciliation. The database then starts without its password reference and crashloops. At that point the live cluster faithfully matches the bad commit, so another reconciliation would reproduce the same failure.

Repairing that class of incident takes knowledge of declared state and runtime state at the same time. The operator has to see the crashloop, compare the live Deployment with its source, find the commit that removed the reference, and propose a repair. None of those steps requires write access to the cluster.

## One read-only lens

[Behold](https://github.com/INTENTIUS/behold) holds the declared and observed estate in one graph. A degraded Deployment appears there within seconds, which gives the agent one place to ask what changed and what is unhealthy.

The agent reads `/api/diff?env=home` through a bearer-token proxy that accepts GET requests. The service account behind Behold can only read. Pods and ReplicaSets are filtered from the agent's view, so a short-lived child object cannot page it into an investigation. The durable Deployment carries the health signal.

Behold exposes two useful identity schemes. Bare IDs refer to declared Flux Kustomizations. IDs shaped like `Kind/ns/name` refer to observed runtime objects. The agent can move from the failed Deployment to the source that declared it without assembling the relationship from a series of `kubectl` calls.

## The break travels out and the repair comes back

Prometheus starts the loop with an `EstateWorkloadDown` rule after 30 seconds of failure. That interval is tuned for rehearsals. A production service can wait longer without changing the rest of the architecture.

Alertmanager sends the same alert down two paths. ntfy pages my phone, and a webhook reaches `estate-dispatcher`. The dispatcher owns no Kubernetes permissions. It holds one Fountain API key, deduplicates alerts by fingerprint, and opens a conversation for `estate-medic`.

The agent wakes in an off-cluster sandbox. It reads Behold, inspects the source repository, and correlates the failing object with recent history. When it finds the cause, it commits the repair and opens a PR as my agent-driven GitHub account, BinaryBourbon.

Flux remains the only component that can apply the repair. The agent's entire write path ends at Git.

## The edge the agent cannot draw

Branch protection requires one approving review on `main`. BinaryBourbon is a non-admin collaborator, and GitHub rejects its attempt to approve its own PR with a 422. An attempted merge returns a 405 because someone other than the last pusher must approve it.

My review is the only gate in the cycle. Once I approve and merge, Flux receives the webhook, reconciles the same path that shipped the break, and rolls the workload healthy. The resolved alert closes the incident and reaches my phone.

The division of authority stays small enough to audit. The dispatcher can open a conversation. The agent can read the estate and write a Git branch. Flux can change the cluster. I control the edge that connects the branch to `main`.

## What the loop has shipped

The bot has ten commits on `main` so far. They include a Longhorn over-provisioning fix, a memory limit for the CloudNativePG operator, and four resource-limit changes to Behold's own pod. Two more Behold changes are still open.

The `repo-sync` sidecar is a good sample. Its 250 millicore limit left it throttled about 94 percent of the time. The expensive work was `make install` after a lockfile change, not the fetch every 30 seconds. The agent reached that diagnosis by comparing the container spec with the throttling metric, then opened the resource change through the same path it uses for every other repair.

## Where Behold rubbed

The loop also found edges in the tool itself.

<div class="wide-table" role="region" aria-label="Behold integration findings" tabindex="0">
<table>
  <thead>
    <tr><th>Finding</th><th>What happened</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr><td><a href="https://github.com/INTENTIUS/behold/issues/294">#294</a> absent from 0.10.1</td><td>The loop depends on rollout health, so I build a pinned commit from source.</td><td>Standing</td></tr>
    <tr><td><code>web/</code> outside the bundle</td><td>The graph returns a 500 when <code>flux.svg</code> is absent, even while the pod stays Ready. This affects non-npm installs.</td><td>Worked around</td></tr>
    <tr><td><a href="https://github.com/INTENTIUS/behold/issues/295">#295</a> unbounded fan-out</td><td>Eleven members started eleven concurrent Chant processes. Reads took 60 seconds and memory reached 6 GiB. <a href="https://github.com/INTENTIUS/behold/pull/306">#306</a> brought steady use to 0.8 GiB.</td><td>Fixed</td></tr>
    <tr><td>No cheap health read</td><td>An overlay read takes 60 seconds. <code>/healthz</code> is the only safe probe and the only degradation signal I poll.</td><td>Open ask</td></tr>
    <tr><td><code>serve</code> ignores <code>.behold.json</code></td><td>Members must be command arguments, so the list lives in both the manifest and container spec.</td><td>Open ask</td></tr>
    <tr><td>Inline kubeconfig token only</td><td><code>chant-k8s-client</code> reads <code>token:</code> but not <code>tokenFile:</code>. A projected token returns 401 after an hour, which forced a legacy service-account token Secret.</td><td>Open ask</td></tr>
    <tr><td>Runtime sweep hits every group</td><td>Two rounds of RBAC widening came from reading 403 responses. <code>limitranges</code> and <code>podtemplates</code> were the surprises.</td><td>Worked around</td></tr>
    <tr><td>UID 1000 on a root <code>emptyDir</code></td><td>Git rejects each call for dubious ownership. One system gitconfig covers every container.</td><td>Worked around</td></tr>
  </tbody>
</table>
</div>

## What I want from Behold next

- A health-only read that skips SVG composition, so I can poll Behold instead of Prometheus.
- Per-member reads, so one workload alert reads one member instead of eleven.
- `tokenFile:` support in `chant-k8s-client`, so in-cluster pods can use projected tokens.
- A documented minimum ClusterRole and a note for changes to the `/api/diff` response shape.

The loop has one privileged actuator, one human gate, and no cluster credential in the agent sandbox. Every new failure rehearsal has to preserve those three properties while shortening the path from evidence to a reviewable diff.
