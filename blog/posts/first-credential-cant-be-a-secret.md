---
layout: layouts/blog.html
eleventyExcludeFromCollections: true
title: "The first credential can't be a secret"
description: "Anything an agent reads is compromised on read, so the first credential has to be proof its platform signed, and every grant hangs off verifying that proof"
permalink: /blog/posts/first-credential-cant-be-a-secret/
date: 2026-07-30
---

An agent is useful in proportion to what it can reach, and reaching anything real means authenticating to it. The same agent writes and runs code no human reviews before it executes, and its behavior bends to whatever it reads, so an attacker reaches its [sandbox](/blog/posts/new-kind-of-computer/) by getting text in front of it. Exfiltrating any value it can read takes one HTTP request to a domain you already allow. The machine that needs your credentials is untrusted, and every secret it can read is compromised the moment it reads it.

Any secret that enters the machine must be short-lived, so a stolen copy dies before it travels far. And it must carry no new trust, so a stolen copy transfers no power beyond what the sandbox already had. We can't hand agents the same long-lived API keys we'd give traditional software. That leaves a first credential that is a signed name rather than a secret, with every real grant decided against that name by a verifier.

## Secret zero

The rules sound satisfiable until you try to bootstrap them. Short-lived credentials come from a secret store that mints them, and the store needs a reason to trust whoever is asking. The obvious move is injection, because the create call's environment block is the one channel you control before untrusted code runs, and env vars at boot are how every service you've ever deployed got its secrets. But a store token is a key, the store grants access to whoever holds it, and possession is the entire proof. Inject one shared key and revoking a single sandbox means rotating the fleet. Mint a key per sandbox and your control plane now holds the credential that mints them, the same secret one level up. Every variant delivers a key into a machine we already declared compromised, and the store can't tell a copy from the sandbox. Vault people call this circle secret zero. Shortening a key's life narrows the window without changing the shape.

The fix is to stop delivering keys. The first credential has one job, answering which sandbox is asking, and a credential that only names the asker grants nothing a thief can spend. What it needs is to be unforgeable, and unforgeable is a property a public document can have. Anything the sandbox's own code could mint, an impostor's could mint identically, so the name has to come from outside the machine. The natural author is the platform. It booted the sandbox, it knows which user the agent belongs to and under what policy, and trusting its word costs nothing new, it already runs the hypervisor and could read every byte in the machine anyway. So the platform signs a short statement saying exactly that, and anyone holding its published keys can verify the statement came from it, unaltered. The signing key never travels, so the chain stops collecting secrets and ends in a trust you extended the day you picked the platform.

This is why the first credential can't be a secret. A secret proves possession, and a copy possesses it just as well. A signed statement proves origin, and origin is the one thing code in the sandbox can't fake.

## The signed statement

Fly Machines show the shape. Any process inside can request an OIDC token over a local socket, and the claims name the app, the machine ID, and the digest of the image that booted, so the token attests what code is running rather than just which machine asked. It expires in minutes, works only for the audience it names, and nothing pre-shared ever sat in the environment. Steal one and you've stolen an ID card that lapses before you get it home. A thief gets to be this one sandbox, for a few minutes, inside a policy already scoped to this one sandbox, and a rogue sandbox was the starting assumption. The token names trust that already exists without adding any.

## Verify, then grant

The verifier, a secret store or a proxy, checks three things before anything is granted. The signature verifies against the platform's published keys, so the agent really is the platform's. The identity is in good standing, created at session start and deleted at teardown, so a revoked agent fails the check and every token it ever held dies with it. And policy allows the specific request. Infisical's attribute-based policies template the secret path from an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox a private directory under one identity definition.

Access then flows in two shapes. Some access is binary, this sandbox may reach the staging database or it may not, and a lease enforces that, a per-sandbox database user minted on demand and destroyed at expiry, so an exported copy authenticates nothing by the time anyone reads it. Other access is metered. An inference key gates a meter rather than a door, a stolen copy spends invisibly inside your own usage, and no lease is short enough to fix invisibility, so the real key lives at a proxy that injects it after the request leaves the machine and charges every request to the verified identity, with a budget where the open-ended bill used to be.

Both shapes obey the rules from the top, every grant scoped to one sandbox and one session. And these machines park, weeks of wall clock against hours of runtime, so a sandbox suspended past its token's expiry wakes holding nothing and simply proves itself again.

## The verifier is a purchase

None of this is new machinery. Every app in [my cluster](/blog/posts/how-i-use-infisical/) authenticates to Infisical with the service account token Kubernetes projects into its pod, and GitHub Actions normalized the same move for CI in 2021. Infisical verifies these assertions out of the box, so the verifying side is something you buy. The asserting side is what's new, and vendors differ mainly on where it happens. Fly and Modal let the workload prove itself from inside the machine. Vercel, Cloudflare, and Daytona assert at the edge, stapling identity onto egress while the code inside holds nothing. AWS pushes execution-role credentials in at boot, real vouching with a real caveat, the delivered credential lives for hours and works from a laptop.

## What I'm building

I closed [the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. That promise now has a shape. Each agent's sandbox presents an identity its platform signed, the store verifies the signature, the standing, and the policy, and every grant arrives scoped to that one sandbox, dying at teardown or held behind the proxy's budget. Anything the agent actually read gets rotated on sight, which stays cheap because nothing it read was scoped wider than one sandbox.

If you're evaluating sandbox platforms, the question list is one item long. Where does a sandbox's identity get asserted, and how does the credential arrive? Any answer bootstraps real secret management. No answer means injected keys and secret zero for the life of the fleet. Ask before you park one.
