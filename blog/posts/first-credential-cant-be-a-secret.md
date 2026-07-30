---
layout: layouts/blog.html
eleventyExcludeFromCollections: true
title: "The first credential can't be a secret"
description: "Anything an agent reads is compromised on read, so the first credential has to be proof its platform signed, and every grant hangs off verifying that proof"
permalink: /blog/posts/first-credential-cant-be-a-secret/
date: 2026-07-30
---

An agent is useful in proportion to what it can reach. Reading your email, opening a pull request, querying the staging database, calling a model, every real job starts with authenticating to a system you care about, and authentication runs on secrets. So the [new kind of computer](/blog/posts/new-kind-of-computer/) needs credentials within the first few minutes of any real work. An agent that can't log in to anything is a safe machine doing nothing.

One constraint shapes everything that follows. The code in that sandbox is untrusted. Some of it the agent wrote minutes ago, none of it was reviewed, and exfiltrating any value it can read takes one HTTP request that no scanner reliably catches. So every secret the agent can read is compromised the moment it reads it. This is the same design assumption that treats user input as hostile, and it holds no matter how well-behaved your agents have been so far.

Two rules follow. Any secret that must enter the machine has to be short-lived, so a stolen copy dies before it travels far. And no secret in the machine may carry new trust, so a stolen copy transfers no power beyond what the sandbox already had. A long-lived API key with production scope fails both, which is why you can't hand an agent the keys you'd hand a service.

## Secret zero

The rules sound satisfiable until you try to bootstrap them. Short-lived credentials come from a secret store that mints them, and the store needs a reason to trust whoever is asking. The obvious move is injection, because the create call has an environment block right there, the one channel you control before untrusted code runs, and env vars at boot are how every service you've ever deployed got its secrets. It fails either way you shape it. Inject one shared token and revoking a single sandbox means rotating the fleet. Mint a token per sandbox and the control plane now holds the minting credential, a long-lived key that issues store access for anyone, the same secret one level up. And under both shapes the store trusts whoever holds the token, so a copy is indistinguishable from the sandbox, and the token just traveled into a machine we already declared compromised. Vault people call this circle secret zero. Shortening the token's life narrows the window without changing the shape.

The first credential has one job, answering which sandbox is asking. A claim like that needs to be unforgeable, and unforgeable is a property a public document can have. Anything the sandbox's own code could mint, an impostor's code could mint identically, so the claim has to come from outside the machine. The natural author is the platform. It booted the sandbox, it knows which user the agent belongs to and under what policy, and trusting its word costs nothing new, it already runs the hypervisor. So the platform signs a short statement saying exactly that, and anyone holding its published keys can verify the statement came from it, unaltered.

This is why the first credential can't be a secret. A secret proves possession, and a copy possesses it just as well. A signed statement proves origin, and origin is the one thing code in the sandbox can't fake.

## The signed statement

Fly Machines show the shape. Any process inside can request an OIDC token over a local socket, and the claims name the app, the machine ID, and the digest of the image that booted, so the token attests what code is running rather than just which machine asked. It expires in minutes and works only for the audience it names. Nothing pre-shared ever sat in the environment. Steal one and you've stolen an ID card that lapses before you get it home.

Even the theft moves no trust. A thief holding the token gets to be this one sandbox, for a few minutes, inside a policy already scoped to this one sandbox, and a rogue sandbox was the starting assumption. The token names trust that already exists without adding any, which satisfies both rules by construction. The stronger form moving through the standards bodies binds the credential to a key the machine never exports, and then even the borrowed minutes go away.

## Verify, then grant

The verifier, a secret store or a proxy, checks three things before anything is granted. The signature has to verify against the platform's published keys, which proves the agent really is the platform's. The identity has to be in good standing, an identity created at session start and deleted at teardown, so a revoked agent fails the check and every token it ever held dies with it. And policy has to allow the specific request. Infisical's attribute-based policies template the secret path from an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox a private directory under one identity definition.

Access then flows in two shapes. Some access is binary, this sandbox may reach the staging database or it may not, and a lease enforces that. A dynamic secret mints a per-sandbox database user and destroys it when the lease expires, so an exported copy authenticates nothing by the time anyone reads it, and rotation happens as a side effect of teardown. Other access is metered. An inference key gates a meter rather than a door, a stolen copy spends invisibly inside your own usage, and no lease is short enough to fix invisibility. Metered access belongs at a proxy that keeps the real key, injects it after the request has left the machine, and charges every request to the verified identity, with a budget where the open-ended bill used to be.

Both shapes obey the rules from the top, because every grant's subject is one sandbox and its lifetime is one session. The duty cycle of these machines even agrees with the design. They live weeks of wall clock and hours of actual runtime, and tokens age on the wall clock, so a sandbox suspended past its token's expiry wakes up holding nothing and simply proves itself again.

## The verifier is a purchase

None of this is new machinery. Every app in [my cluster](/blog/posts/how-i-use-infisical/) authenticates to Infisical with the service account token Kubernetes projects into its pod, no stored credential anywhere, and GitHub Actions normalized the same move for CI in 2021. Infisical verifies assertions from Kubernetes, the major clouds, and any OIDC, JWT, or SPIFFE issuer, so the verifying side is something you buy. The asserting side is what's new, because these sandboxes belong to users rather than platform teams, and vendors differ mainly on where the assertion happens. Fly and Modal let the workload prove itself from inside the machine. Vercel, Cloudflare, Daytona, and Fly's own Sprites assert at the edge instead, the platform stapling identity onto egress while the code inside holds nothing. AWS pushes execution-role credentials in at boot, which is real vouching with a real caveat, the delivered credential lives for hours and works from a laptop.

## What I'm building

I closed [the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. The chain above settles what that means. Each agent's sandbox presents an identity its platform signed. The store verifies the signature, the standing, and the policy, then scopes every read to that sandbox's own path. Binary grants arrive as leases that die at teardown, metered grants sit behind a proxy with a budget, and anything the agent actually read gets rotated on sight, which stays cheap because every grant was scoped to one sandbox to begin with.

If you're evaluating sandbox platforms, the question list is one item long. Where does a sandbox's identity get asserted, and how does the credential arrive? Inside the machine, at the edge, pushed at boot, any of those answers bootstraps real secret management. No answer means injected copies, a vault in your control plane, and secret zero for the life of the fleet. Ask before you park one.
