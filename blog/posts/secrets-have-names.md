---
layout: layouts/blog.html
tags: ["posts"]
title: "What my agents can do now that secrets have names"
description: "Moving secrets behind names expanded what I can delegate more than any model upgrade"
permalink: /blog/posts/secrets-have-names/
date: 2026-07-24
---

AI agents work in my repos and my [home cloud](/homelab/) every day. They write manifests, onboard apps, and diagnose failures. The models have been good enough for that work for a while. The wins are in enablement, arranging the environment so more of the work is safe to hand to an agent. A big one was moving my secrets behind names.

Every secret in my cluster lives in Infisical and has a stable address, the project plus the secret name plus the key. The value stays in the store. Only the systems with runtime privilege, the operator and the apps themselves, ever resolve a name into a value.

I've already written about [why I chose Infisical over SOPS](/blog/posts/why-infisical-over-sops/) and [how the whole setup is wired](/blog/posts/how-i-use-infisical/). This is about the jobs that used to be mine and can now be delegated, because a secret an agent can name is a secret an agent can work with.

## We can talk about secrets now

Before, "which token does Alertmanager use to reach ntfy?" was a dangerous question. Answering it honestly meant a value on the screen, in a context window, in a transcript that outlives the conversation. So secrets were the topic we talked around, and every plan that touched one had a hole in the middle shaped like *you handle this part*.

Now secrets are nouns. An agent and I can discuss the Cloudflare token in the bootstrap kernel, or whether `oauth2-proxy-secrets` should split into two, the same way we discuss a Deployment or a Service. Debugging, planning, and design conversations reference secrets by the same names that appear in the manifests and in the Infisical UI.

## They write the wiring

When an agent onboards an app to my cluster, it writes the InfisicalSecret CR, the ServiceAccount, and the `envFrom` that points the pod at `myapp-secrets`. When it updates a runbook, it can write "rotate `SMTP_PASSWORD` in the mailer project" instead of gesturing vaguely at "the mail credentials." The resolution happens later, somewhere else, by the operator that actually holds privilege. The agent wrote every line of the plumbing and was never trusted with a value.

The agent creates the slot and I fill the value. For self-minted secrets, even that job isn't mine. oauth2-proxy's session secret is 32 random bytes that nobody needs to know, and the agent knows both the algorithm and the address. So it writes the one-liner, `infisical secrets set SESSION_SECRET=$(openssl rand -base64 32)`, and runs it through my logged-in CLI. The value travels from openssl into the store without ever existing in the agent's context, my clipboard, or a screen. Nobody has seen that secret, and nobody needs to. My job is down to the values only a third party's dashboard will mint.

## They can see the whole inventory

An agent in my repo can list every secret that exists without reading any of them. Which projects exist, which keys each app consumes, which InfisicalSecret delivers what to where.

That read-only view covers a whole class of chores. Auditing which apps consume which credentials. Spotting the key that no workload references anymore. Onboarding app N+1 by pattern-matching apps one through N. Under SOPS this was [possible but never natural](/blog/posts/why-infisical-over-sops/), because the names were scattered across encrypted files and everything past discovery ran through decryption on my laptop. Now discovery is the cheap, safe, default path. An agent can be exhaustively curious about my secrets and never read a single value.

## Leak response is becoming an agent task

Rotation in my cluster is one step: paste the new value into the UI, and the operator handles propagation and restarts. I covered that machinery in the [SOPS post](/blog/posts/why-infisical-over-sops/).

Infisical has an API, and so do many of the providers that mint these credentials. When both ends have one, the loop can close without me. An agent that spots a token in a log can mint a replacement at the provider, write it to Infisical, let the operator roll it out, and revoke the old one. The leak is fixed before I've read the alert.

Not every secret supports that today. But it changes what I need from an agent. I don't need one that provably never mishandles a secret. I need recovery cheap enough that responding to a mistake is a reflex, whether the mistake was mine or the machine's. Bounded blast radius beats flawless behavior, for humans and agents alike.

## The next step: identities for the agents themselves

My agents do all of this without any Infisical access of their own. Names need no authentication. The one write, minting a value, goes through my logged-in CLI. The identity stays mine; only the hands are the agent's.

That borrowed CLI is the loose end. An agent working through my login carries every permission I have, and this whole migration was about killing that shape of credential. The fix already runs in the cluster. Every app has its own machine identity, scoped to one project with the smallest role that does the job. My agents are next. Purpose-built identities, scoped to the work each one does, minted by the same pattern that onboarded every app.

That's the next post.

## Do more means delegate more

In the [agent-ready infrastructure post](/blog/posts/agent-ready-infrastructure/) I asked whether a competent stranger could operate your system on day one. Secrets were always the room the stranger could never enter, so every task that passed through that room bounced back to me.

Names changed the shape of the room. The stranger still can't enter, and now it doesn't need to. It can describe the room, wire things to it, inventory it, and call for a locksmith when a key leaks, all from the hallway.

That's what "doing more with agents" has actually meant here. Not smarter agents, and not more trust. A system arranged so that trust is mostly unnecessary, and the work flows anyway.
