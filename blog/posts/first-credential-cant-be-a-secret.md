---
layout: layouts/blog.html
eleventyExcludeFromCollections: true
title: "The first credential can't be a secret"
description: "Anything an agent reads is compromised on read, so the first credential has to be proof its platform signed, and every grant hangs off verifying that proof"
permalink: /blog/posts/first-credential-cant-be-a-secret/
date: 2026-07-30
---

An agent is useful in proportion to what it can reach, and reaching anything real means authenticating to it. The same agent writes and runs code no human reviews before it executes, and its behavior bends to whatever it reads, so an attacker reaches its [sandbox](/blog/posts/new-kind-of-computer/) by getting text in front of it. Exfiltrating any value it can read takes one HTTP request to a domain you already allow. The machine that needs your credentials is untrusted, and every secret it can read is compromised the moment it reads it.

Any secret that enters the machine must be short-lived, so a stolen copy dies before it travels far. And it must carry no new trust, so a stolen copy transfers no power beyond what the sandbox already had. We can't hand agents the same long-lived API keys we'd give traditional software. By brokering the credentials through a proxy on the trusted side of the boundary, the agent carries only short-lived tokens, each one swapped for the access the job needs, and nothing stable ever enters the sandbox.

## Identifying the agent

Brokering works as long as the proxy can identify the agent, so the sandbox has to present a first credential. We do this by injecting a short-lived token the platform signed. The credential could have been an opaque key, with the broker keeping a table of who holds what, but a key's meaning lives in that table. The platform and the broker would share state per sandbox, only the broker holding the table could check anything, and delivering each key safely is the problem brokering was meant to solve, the circle Vault people call secret zero.

A signed token carries its meaning instead. Its claims name the sandbox and the user it acts for, and anyone holding the platform's published keys can verify them with no table and no prior relationship. Mint a fresh token every few minutes and every one still names the same sandbox, so the credential is disposable while the identity is durable. Short-lived stops costing anything, because expiry means re-signing rather than re-registering.

The signature is what makes the name worth trusting. Anything the sandbox's own code could mint, an impostor's could mint identically, so the name has to come from outside the machine, and the natural author is the platform. It booted the sandbox, it knows which user the agent belongs to and under what policy, and trusting its word costs nothing new, it already runs the hypervisor and could read every byte in the machine anyway. So the platform signs exactly that statement. The signing key never travels, so the chain stops collecting secrets and ends in a trust you extended the day you picked the platform.

This is why the first credential can't be a secret. A secret proves possession, and a copy possesses it just as well. A signed statement proves origin, and origin is the one thing code in the sandbox can't fake.

## The signed statement

Fly Machines show the shape. Any process inside can request an OIDC token over a local socket, and the claims name the app, the machine ID, and the digest of the image that booted, so the token attests what code is running rather than just which machine asked. It expires in minutes, works only for the audience it names, and nothing pre-shared ever sat in the environment. Steal one and you've stolen an ID card that lapses before you get it home. A thief gets to be this one sandbox, for a few minutes, inside a policy already scoped to this one sandbox, and a rogue sandbox was the starting assumption. The token names trust that already exists without adding any. What's left is bearer risk, whoever holds the token can present it. The WIMSE drafts at the IETF close that too, binding the token to a private key the sandbox never transmits, so every request carries a fresh proof of possession and a stolen token presents nothing on its own.

## Verify, then grant

The broker, a secret store or a proxy, checks three things before anything is granted. The signature verifies against the platform's published keys, so the agent really is the platform's. The identity is in good standing, created at session start and deleted at teardown, so a revoked agent fails the check and every token it ever held dies with it. And policy allows the specific request. Infisical's attribute-based policies template the secret path from an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox a private directory under one identity definition.

Access then flows in two shapes. Some access is binary, this sandbox may reach the staging database or it may not, and a lease enforces that, a per-sandbox database user minted on demand and destroyed at expiry, so an exported copy authenticates nothing by the time anyone reads it. Other access is metered. An inference key gates a meter rather than a door, a stolen copy spends invisibly inside your own usage, and no lease is short enough to fix invisibility, so the real key lives at a proxy that injects it after the request leaves the machine and charges every request to the verified identity, with a budget where the open-ended bill used to be.

Both shapes obey the rules from the top, every grant scoped to one sandbox and one session. And these machines park, weeks of wall clock against hours of runtime, so a sandbox suspended past its token's expiry wakes holding nothing and simply proves itself again.

## The verifier is a purchase

None of this is new machinery, the standards world calls it workload identity. Every app in [my cluster](/blog/posts/how-i-use-infisical/) authenticates to Infisical with the service account token Kubernetes projects into its pod, and GitHub Actions normalized the same move for CI in 2021. The IETF is now writing down the agent version. [A draft framework](https://datatracker.ietf.org/doc/html/draft-klrc-aiagent-auth) with authors from AWS, OpenAI, and Okta models every agent as a workload with exactly one identifier, provisions it short-lived credentials at runtime with posture checked at each issuance, hands authorization to OAuth, and calls static API keys an antipattern in so many words. Infisical verifies these assertions out of the box, so the verifying side is something you buy. The asserting side is what's new, and vendors differ mainly on where it happens. Fly and Modal let the workload prove itself from inside the machine. Vercel, Cloudflare, and Daytona assert at the edge, stapling identity onto egress while the code inside holds nothing. AWS pushes execution-role credentials in at boot, real vouching with a real caveat, the delivered credential lives for hours and works from a laptop.

## What I'm building

I closed [the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. That promise now has a shape. Each agent's sandbox presents an identity its platform signed, the store verifies the signature, the standing, and the policy, and every grant arrives scoped to that one sandbox, dying at teardown or held behind the proxy's budget. Anything the agent actually read gets rotated on sight, which stays cheap because nothing it read was scoped wider than one sandbox.

If you're evaluating sandbox platforms, the question list is one item long. Where does a sandbox's identity get asserted, and how does the credential arrive? Any answer bootstraps real secret management. No answer means injected keys and secret zero for the life of the fleet. Ask before you park one.
