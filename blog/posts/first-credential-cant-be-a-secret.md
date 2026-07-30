---
layout: layouts/blog.html
eleventyExcludeFromCollections: true
title: "The first credential can't be a secret"
description: "You can't trust the sandbox, so the platform that boots it has to vouch for it, and every credential it touches arrives already expiring"
permalink: /blog/posts/first-credential-cant-be-a-secret/
date: 2026-07-30
---

You will never be able to trust the sandbox, so stop trying to give it a secret that proves who it is. Make the platform that booted it vouch for it instead. Every real credential it gets after that should arrive already expiring, and be thrown away for good when the agent shuts down, because the sandbox we just gave it to was never trustworthy to begin with.

The sandbox is a [new kind of computer](/blog/posts/new-kind-of-computer/), and it needs secrets for any real job, a GitHub token, a database login, an API key. The secrets live in a store, and the store needs a reason to trust who's asking. Only the platform has one to give. It booted the machine, chose the image, and watched it come up, a view no code running inside can match or fake. So the store takes the platform's word for which sandbox is asking, and everything above rests on that word.

## Secret zero

Delivery is the problem. Secrets are safe in the store, the danger starts when one travels into the machine, and the first credential always travels, it's the one that fetches the rest. The naive delivery is injection, a store token pasted into the environment at create time. Now the control plane is a vault holding a long-lived copy per sandbox, revoking one sandbox means rotating everyone, and the delivered token is itself a secret whose safe delivery was the original problem. Vault people call this secret zero. Shortening its life narrows the window without changing the shape.

Behind delivery sits trust. The sandbox runs code nobody reviewed, so nothing it says about itself counts as evidence, any credential its code could mint, an impostor's code could mint identically. A secret we hand it is no better, a held secret proves possession, and possession is exactly what untrusted code can copy and transfer. The job still requires trusting requests that come out of this machine. The way through is to relocate the testimony. The platform that booted the sandbox knows exactly which sandbox it is, and trusting the platform costs nothing new, it already runs the hypervisor. Let the platform vouch.

## Asserting the identity

Attestation is that vouching made mechanical. The platform signs a statement about the machine it booted, the secret store verifies the signature against the platform's published keys, and nothing pre-shared sits in the environment. Fly Machines show the shape. Any process can request an OIDC token over a local socket, and the claims name the app, the machine ID, and the digest of the image that booted, so the token attests what code is running, not just which machine asked. It expires in minutes, works only for the audience it names, and the sandbox carries it without being able to author it. Steal one and you've stolen an ID card that lapses before you get it home. The short life and narrow audience matter, an attested token is still a bearer instrument, whoever holds it can spend it. The stronger form moving through the standards bodies binds the credential to a key the machine never exports, so a stolen copy is inert.

None of this is new machinery. Every app in [my cluster](/blog/posts/how-i-use-infisical/) authenticates to Infisical with the service account token Kubernetes projects into its pod, no credential stored anywhere, and GitHub Actions normalized the move for CI in 2021. Infisical verifies assertions from Kubernetes, the big clouds, and any OIDC, JWT, or SPIFFE issuer, so the verifying side is a purchase, not a project. What's new is the asserting side. These sandboxes belong to users rather than platform teams, and one developer parks dozens of them a week.

## What the identity unlocks

Everything downstream of the assertion is policy, and policy needs a subject.

Reads scope first. Infisical's attribute-based policies template the secret path from an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox a private directory under one identity definition, no role minted per machine. Revocation gets the same grain. An identity created at session start and deleted at teardown takes every token it ever issued with it, credentials minted per session, revoked one sandbox at a time.

The grants hanging off the identity come in two shapes. Some access is binary, this sandbox may reach the staging database or it may not, and a lease enforces that cleanly. Infisical's dynamic secrets mint a per-sandbox database user and destroy it when the lease expires, so an exported copy authenticates nothing by the time anyone reads it, and rotation happens as a side effect of teardown. They sit behind paid tiers. Other access is tiered, how many requests, how fast, at what spend. An inference key gates a meter, not a door, and a stolen copy spends invisibly inside your own usage, so no lease is short enough. Metered resources want a proxy that keeps the real key, injects it after the request leaves the machine, and charges every request to the asserted identity, with a budget where the open-ended bill used to be.

One constraint shapes every derivative. Anything the agent reads is compromised the moment it reads it, exfiltration is one HTTP request. So the derivatives are built to be worthless to export, short-lived, scoped to one sandbox, or never inside the machine at all. The identity can afford to be the durable credential because it was never a secret.

## Where the assertion happens

Every sandbox vendor runs an identity system. The differences are in where the assertion happens and how the credential arrives.

Fly and Modal put it inside the machine, by different deliveries. Fly mints on demand, any process asks the local socket and gets a fresh token for the audience it names. Modal delivers at boot, an environment variable scoped to the individual container, though for Modal Sandboxes it ships disabled.

AWS runs a third model, and nothing inside the microVM ever asserts anything. When the control plane launches a Lambda MicroVM it assumes the execution role itself, as the Lambda service, and pushes the session credentials into the environment at birth, no metadata service to ask. The vouching is real, the platform knows exactly what it launched, but what lands is a bearer credential that lives for hours and works from a laptop. AWS guarantees isolation between environments, not binding of the credential to its environment, EC2 role credentials can be locked to their home VPC and Lambda's can't, so exfiltration gets detected rather than prevented. And every microVM sharing an execution role looks like one principal.

Vercel, Cloudflare, and Daytona assert at the edge. Vercel's egress firewall staples a signed token naming the sandbox onto requests it forwards to a proxy you run. Cloudflare's supervising Worker knows which sandbox is calling and applies per-sandbox policy while the code inside holds nothing. Daytona hands each sandbox placeholder values and substitutes the real ones at its proxy, only for allowlisted hosts. Same assertion, made by the platform at the boundary instead of by the workload inside.

Sprites, the machine Fly sells for agents, documents no in-machine identity, so I went looking for an undocumented one. The Machines socket lives at `/.fly/api`, and inside a sprite the directory doesn't exist, `find` matches nothing, and no FLY or OIDC environment variable appears anywhere. Fly moved the entire assertion to the edge rather than omitting it. Connectors hold the provider tokens and apply policy per sprite. One company builds both ends of the spectrum, and its agent product picked the edge.

## What survives suspension

These machines live for weeks of wall clock and hours of actual runtime, and store tokens age on the wall clock. A sandbox suspended past its token's TTL wakes up unauthenticated, which is the alignment you want, credentials bound to runtime instead of calendar time. The parked machine holds nothing worth stealing.

The derivatives are supposed to die while parked. The disk returns because the platform checkpointed it, the identity returns because the machine proves itself again at wake, so the assertion path has to survive restore as reliably as the disk does. On the platforms that push instead of letting the machine pull, the wake path runs the other direction, the platform re-delivers, which is why AWS documents a resume hook for refreshing credentials. One old wrinkle survives, IP allowlists break exactly when a microVM resumes on a different host with a different egress address. Every rule here was written for a machine that either runs or dies, and this machine does neither.

## What I'm building

I [closed the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. The bootstrap chain settles what that means. Each agent's sandbox asserts an identity its platform vouches for. The store verifies the assertion and scopes every read to that sandbox's own path. Binary grants arrive as leases that die at teardown, tiered grants sit behind a proxy with a budget, and anything the agent actually read gets rotated on sight, which stays cheap because every grant was scoped to one sandbox to begin with.

If you're evaluating these platforms, the question list is one item long. Where does a sandbox's identity get asserted, and how does the credential arrive? Fly Machines let the workload pull fresh proof on demand. Modal and AWS push it in at birth. Vercel, Cloudflare, Daytona, and Sprites keep it at the edge. Any of those answers bootstraps real secret management. No answer means injected copies, a vault in your control plane, and secret zero for the life of the fleet. Ask the question before you park a fleet.
