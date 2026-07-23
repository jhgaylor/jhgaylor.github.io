---
layout: layouts/blog.html
tags: ["posts"]
title: "Agent-ready infrastructure is mostly good ops"
description: "The properties that let AI agents safely operate a system are the ones good systems always wanted"
permalink: /blog/posts/agent-ready-infrastructure/
date: 2026-07-22
---

AI agents are joining engineering teams as contributors and operators. Most of the conversation is about which AI tools to adopt, and I think that's the wrong end of the problem. The better question is whether your system has the properties that make delegation safe in the first place.

I run agents against my [home cloud](/homelab/) every day. They write manifests, onboard apps, diagnose failures, and propose fixes. Almost nothing in that cluster is AI infrastructure. What makes it work is a set of properties good operations people have wanted forever. This post walks through each one, why it carries the weight, and what breaks without it. My homelab is the running example, but none of this is homelab-specific.

## One reviewable write path

An agent produces changes faster than you can watch it work. If you supervise action by action, you're the bottleneck, and eventually you'll stop looking. The property you want is that every change, no matter who makes it, becomes a diff in one place. Review scales because diffs queue up instead of scattering across dashboards and shell histories. Rollback comes free because the history is the interface.

Without this, changes land invisibly. An agent with a kubectl credential can leave your cluster different from every description of it, and you find out during an outage.

My whole cluster works this way. Every subsystem is a file in a git repo, Flux applies whatever lands on main, and undoing a change is a revert. An agent contributing to my infrastructure never touches the cluster. It writes YAML and opens a pull request, the same as I do.

## Predictability over cleverness

Agents work by generalizing from examples. Show one the pattern for deploying an app and it will wire the next app the same way. That's a superpower in a consistent system and a liability in a clever one, because every special case is a trap for a worker that learns from precedent.

Consistency used to be an aesthetic argument. With agents in the repo it becomes a safety property. The more your system looks like one idea repeated, the more of it an agent can safely touch.

In my repo every subsystem gets its own directory, every app deploys with the same chart-and-kustomization shape, and onboarding a new app means dropping one file in a well-known folder. An agent that has read one app has read them all.

## Written down or it doesn't exist

An agent knows what's on disk and nothing else. It wasn't in the room the night you learned that restarting the VPN daemon also takes down the pod network. If that lesson lives in your head, an agent will re-learn it in production, at machine speed.

So the bar for documentation changes. Runbooks, conventions, and recorded gotchas stop being nice to have and become the onboarding program for a workforce that reads everything and attends no meetings. The payoff compounds, too. Unlike human hires, every agent you ever run gets the benefit of every lesson you've written down.

My repo carries its conventions in a file agents load at the start of every session, its failure modes in a runbook, and its repeatable procedures as skills an agent can execute step by step. When something burns me, the scar goes in a file.

## Handles, not custody

Delegation means letting workers act on sensitive things without possessing them. If doing the work requires holding the credential, every worker is a leak vector, and you'll ration delegation by dread.

The fix is names. When every secret has a stable, well-known address, an agent can list what exists, reference the right one in the wiring it writes, and never see a value along the way. I wrote a pair of posts on this, [why I moved off SOPS](/blog/posts/why-infisical-over-sops/) and [how the setup works](/blog/posts/how-i-use-infisical/). The short version is that my secrets live in Infisical and agents only ever touch the names.

## Eyes without hands

Diagnosis shouldn't require power. When an agent can read logs and metrics through an interface that can't change anything, you can grant unlimited curiosity at zero risk. Couple the two together and you're stuck choosing between agents that are blind and agents that are dangerous.

Blind is worse than it sounds. A worker that can't observe consequences will still finish the task, it just finishes on vibes. Cheap read-only telemetry is what turns guessing into diagnosis.

My agents get Grafana over MCP. They query pod logs from Loki and metrics from Prometheus without a shell into anything. Investigating an incident requires no permission that could cause one.

## Bounded blast radius

Mistakes happen at a rate, and adding operators raises the rate. Agents are operators. The systems that absorb this well aren't the ones with the most careful workers. They're the ones where the worst single action is survivable.

You can't hire your way to zero mistakes, so the useful work is arranging the system to need less trust. Scope every identity so a compromised or confused actor reaches one app. Guard the deletes that can't be undone. Keep an escape hatch outside the system for whatever the system can't restore about itself.

In my cluster every app identity can read exactly one project's secrets, the GitOps machinery is forbidden from garbage collecting the secret store, and the keys that rebuild everything live outside the cluster they rebuild.

## One door to the dangerous rooms

Some operations are genuinely dangerous, and the answer isn't keeping agents away from them. It's making sure each dangerous thing has exactly one supported way to do it. Five ad-hoc variants of a risky procedure guarantee that a worker eventually picks the wrong one, and improvised recovery is how small incidents become big ones.

Idempotency does the rest. Entry points that are safe to re-run make retries boring, and agents retry a lot.

Host and cluster operations in my homelab are Ansible playbooks and nothing else. There's no drawer of shell scripts with subtle differences. The risky rooms each have one door, and walking through it twice is harmless.

## Loops that close without a courier

An operator is only as good as its view of consequences. If deploy status and failure alerts route through a human, the agent can't self-correct, and you become a courier between your system and your workers. That's the bottleneck you were trying to remove.

Here's the loop every change in my cluster travels.

![The operating loop. A commit lands, a webhook fires and Flux reconciles, the cluster converges on what the repo says, telemetry and alerts record what happened, and the consequences feed the next commit.](/images/agent-feedback-loop.svg)

A push triggers a webhook and Flux reconciles within seconds. The cluster converges on whatever the repo now says. Telemetry records what actually happened and alerts fire when it's bad. All of it is visible to the same agent that made the commit, so the consequences of change N are sitting there when it's time to write change N plus one.

## Operable versus operated

I want to be clear about where the line sits today. My cluster is agent-operable, and it isn't agent-operated yet. Alerts come to my phone, not to an agent. Approval still means me reading a diff before it merges. Nothing rotates itself end to end without a person in the loop.

Some of that gap I plan to close, like letting an agent receive the alert and start the diagnosis before I've picked up my phone. Some of it I'm keeping on purpose, because a human reading diffs is a cheap gate with a very good catch rate. The properties above are what make closing the gap a choice I get to make gradually instead of a cliff I have to jump.

## The stranger test

Every property in this post reduces to one question. Could a competent stranger operate your system on day one, using only what's written down, through paths you can review, with consequences you can survive?

That's always been what a well-run system looks like. Teams got away with failing the test because human strangers arrive slowly, one hire at a time, and absorb the unwritten rules in meetings and hallways. Agents don't. They arrive instantly, read everything, attend nothing, and take the system exactly as documented.

The stranger finally showed up. The good news is that everything on this list was worth doing anyway.
