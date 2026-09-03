---
layout: layouts/blog.html
tags: ["posts"]
title: "The self-healing estate, end to end"
og_image: /images/og/self-healing-estate.jpg
description: "One commit takes down a workload, one agent authors a PR, one human merges, and the cluster heals"
permalink: /blog/posts/self-healing-estate/
date: 2026-09-02
---

A commit lands on `main`. Flux applies it in about 15 seconds, and the workload starts crashlooping while every drift check stays green.

About two minutes later, an agent opens a fix PR. It has found the root cause and written the smallest repair it can. It has no cluster credentials and cannot merge its own work. That last step belongs to me.

I call the agent `estate-medic`. This is the incident loop running in my [home cloud](https://github.com/jhgaylor/home-cloud).

<figure class="wide-figure">
  <div class="wide-figure-scroll">
    <img src="/images/estate-medic-loop.svg" alt="A commit travels through Flux and causes a workload to fail. Prometheus detects the failure, and Alertmanager sends the incident to a phone and a dispatcher. The dispatcher starts an agent, which reads the estate through Behold and opens a fix PR. Human approval closes the loop back to main.">
  </div>
  <figcaption>Detection to an open PR takes about two minutes. The break travels across the top, the response returns along the bottom, and the amber approval edge belongs to a human.</figcaption>
</figure>

## The failure GitOps cannot see

Flux keeps the cluster matched to Git. That handles drift and applies defects in the source just as faithfully.

The failure that proved this removed a database password reference from a deployment. Kubernetes accepted the manifest, CI stayed green, and Flux applied it. The database went down with the cluster still matching Git exactly. Another reconciliation would have reproduced the failure.

Repairing this class of incident takes knowledge of the intended state and the running system. An operator has to connect the failed workload to the commit that caused it, understand the difference, and propose a repair. None of that work requires permission to change the cluster.

## The loop

Prometheus detects the failed workload. Alertmanager routes the incident to ntfy, which pages my phone, and to `estate-dispatcher`, which starts the automated response.

The dispatcher opens a Fountain conversation for `estate-medic`. Fountain provides the agent's off-cluster execution environment. The dispatcher has no Kubernetes permissions, and the agent has no cluster credentials.

[Behold](https://github.com/INTENTIUS/behold) gives the agent one read-only view of what Git declares and what the cluster is running. The agent combines that evidence with repository history, finds the cause, and opens a PR through my agent-driven GitHub account, BinaryBourbon.

Flux remains the only component that can apply a repair. The agent's write path ends at Git.

## The edge the agent cannot draw

Branch protection requires another account to approve changes to `main`. BinaryBourbon is a non-admin collaborator, so it cannot approve or merge its own PR.

My review is the only gate in the cycle. Once I approve and merge, Flux applies the repair and rolls the workload healthy. Monitoring sees the recovery, closes the incident, and sends the resolution to my phone.

The authority model fits in four lines.

- The dispatcher can start work.
- The agent can read the estate and write a Git branch.
- Flux can change the cluster from `main`.
- I decide what reaches `main`.

Each component holds the minimum authority needed for its role. Compromising the agent would expose infrastructure state and the ability to propose code. It would not grant access to the cluster or production branch.

## Evidence from ordinary work

The bot has ten commits on `main` so far. They include capacity fixes for Longhorn, the storage layer, and CloudNativePG, the database operator. It has also tuned Behold's own deployment.

One Behold sidecar spent about 94 percent of its time throttled at a 250 millicore CPU limit. The agent connected the metric to the container configuration and opened the resource change. I want the loop to absorb narrow, evidence-backed repairs that still arrive as reviewable diffs.

The changes are intentionally boring. The system earns trust by handling routine operational work through the same review and deployment path the team already uses.

## What field use changed

Building the loop exposed more friction in diagnosis than repair. A full Behold read initially took about 60 seconds and launched work across all eleven estate members. One fix cut steady memory use from 6 GiB to 0.8 GiB, but the interface still needs cheaper health checks and reads scoped to one service.

That result changed how I evaluate agent infrastructure. Read-only access has to be fast, targeted, and easier than handing out a shell. The observation interface becomes part of the production control plane once automated operators depend on it.

The 30-second alert is tuned for rehearsals. The durable architecture keeps the roles clear. Monitoring detects, an agent investigates, Git carries the proposal, a human authorizes it, and the existing deployment system applies it.

Two minutes is useful. One human decision is more important. The next step is to extend the loop to more alert classes without giving `estate-medic` any new write permission.
