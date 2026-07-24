---
layout: layouts/blog.html
tags: ["posts"]
title: "What my agents can do now that secrets have names"
description: "Moving secrets behind names expanded what I can delegate more than any model upgrade"
permalink: /blog/posts/secrets-have-names/
date: 2026-07-24
---

AI agents work in my repos and my [home cloud](/homelab/) every day. They write manifests, onboard apps, and diagnose failures. And the single biggest expansion of what I can hand them didn't come from a better model. It came from moving my secrets behind names.

Every secret in my cluster lives in Infisical and has a stable address, the project plus the secret name plus the key. The value stays in the store. Only the systems with runtime privilege, the operator and the apps themselves, ever resolve a name into a value.

I've already written about [why I chose Infisical over SOPS](/blog/posts/why-infisical-over-sops/) and [how the whole setup is wired](/blog/posts/how-i-use-infisical/). This is about the jobs that used to be mine and can now be delegated, because a secret an agent can name is a secret an agent can work with.

## We can talk about secrets now

Before, "which token does Alertmanager use to reach ntfy?" was a dangerous question. Answering it honestly meant a value on the screen, in a context window, in a transcript that outlives the conversation. So secrets were the topic we talked around, and every plan that touched one had a hole in the middle shaped like *you handle this part*.

Now secrets are nouns. An agent and I can discuss the Cloudflare token in the bootstrap kernel, or whether `oauth2-proxy-secrets` should split into two, the same way we discuss a Deployment or a Service. Debugging, planning, and design conversations reference secrets by the same names that appear in the manifests and in the Infisical UI.

## They write the wiring

When an agent onboards an app to my cluster, it writes the InfisicalSecret CR, the ServiceAccount, and the `envFrom` that points the pod at `myapp-secrets`. When it updates a runbook, it can write "rotate `SMTP_PASSWORD` in the mailer project" instead of gesturing vaguely at "the mail credentials." Code and docs can finally name secrets precisely, because naming is safe.

The resolution happens later, somewhere else. The operator presents the app's ServiceAccount token, the server validates it against the cluster, and a plain Kubernetes Secret appears where the manifest said it would. The agent authored correct, working secret plumbing from end to end and was never trusted with a value at any point. It didn't even handle a credential *for the store*, because [Kubernetes native auth](/blog/posts/how-i-use-infisical/) means there's no clientId or clientSecret in the diff to guard.

The division of labor I've come to rely on: the agent creates the slot, I fill the value. A new app's scaffold arrives with the secret names already defined and referenced, and my entire contribution is pasting values into the UI. Agents own structure. Humans own values.

## They can see the whole inventory

An agent in my repo can list every secret that exists without reading any of them. Which projects exist, which keys each app consumes, which InfisicalSecret delivers what to where.

That read-only view covers a whole class of chores. Auditing which apps consume which credentials. Spotting the key that no workload references anymore. Onboarding app N+1 by pattern-matching apps one through N. Under SOPS this was [possible but never natural](/blog/posts/why-infisical-over-sops/), because the names were scattered across encrypted files and everything past discovery ran through decryption on my laptop. Now discovery is the cheap, safe, default path, and an agent can be exhaustively curious about my secrets without a single value moving.

## Leak response is becoming an agent task

Rotation in my cluster is one step: paste the new value into the UI, and the operator handles propagation and restarts. I covered that machinery in the [SOPS post](/blog/posts/why-infisical-over-sops/).

Infisical has an API, and so do many of the providers that mint these credentials. When both ends have one, the loop can close without me. An agent that spots a token in a log can mint a replacement at the provider, write it to Infisical, let the operator roll it out, and revoke the old one. The leak is fixed before I've read the alert.

Not every secret supports that today. But it changes what I need from an agent. I don't need one that provably never mishandles a secret. I need recovery cheap enough that responding to a mistake is a reflex, whether the mistake was mine or the machine's. Bounded blast radius beats flawless behavior, for humans and agents alike.

## The frontier: identities for the agents themselves

My agents currently have no Infisical identity at all, and that's not an oversight, it's the design. Names need no authentication. Everything above, the conversations, the wiring, the inventory work, runs on information that's already in the repo and the CRs.

At some point an agent will need real access, probably the day one takes over rotation end to end. When that happens it won't get my credentials. It'll get what every app in the cluster gets: its own machine identity, scoped to exactly the projects it needs, with the smallest role that does the job. The pattern that onboarded umpteen apps is sitting there waiting to onboard a new kind of worker.

That's a post for when it happens.

## Do more means delegate more

In the [agent-ready infrastructure post](/blog/posts/agent-ready-infrastructure/) I asked whether a competent stranger could operate your system on day one. Secrets were always the room the stranger could never enter, so every task that passed through that room bounced back to me.

Names changed the shape of the room. The stranger still can't enter, and now it doesn't need to. It can describe the room, wire things to it, inventory it, and call for a locksmith when a key leaks, all from the hallway.

That's what "doing more with agents" has actually meant here. Not smarter agents, and not more trust. A system arranged so that trust is mostly unnecessary, and the work flows anyway.
