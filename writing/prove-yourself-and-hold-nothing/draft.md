# The first credential can't be a secret

*Draft v3 for jakegaylor.com, 2026-07-29. Title is a working proposal; alternates in outline.md. v1 (two camps) and v2 (three secret classes) are in git history.*

*Leases, proxies, scoped reads, and budgets are all policy, and policy needs a subject. Secret management for agent sandboxes bootstraps from asserting which sandbox is asking.*

An agent sandbox has a bootstrapping problem. The job needs secrets, a GitHub token, a database login, a key for whatever API the work touches. The secrets need a store, because the [new kind of computer](/blog/posts/new-kind-of-computer/) runs code nobody reviewed, and you don't bake credentials into an image whose interesting code arrives at runtime. And the store needs a reason to trust who's asking, which is the strange rung, because the sandbox is exactly the thing we decided not to trust. Every safe design I've found for these machines rests on that bottom rung. Assert which sandbox is asking, in a way its own code can't fake, and everything above follows.

## Secret zero

Delivery is the problem. Secrets are safe while they sit in the store. The danger starts when one has to travel into the machine, and the first credential always has to travel, it's the one that fetches the rest. The naive delivery is injection, the control plane pastes a store token into the environment at create time. Now the control plane is a vault holding a long-lived copy for every sandbox it ever creates, revoking one sandbox means rotating all of them, and the token just delivered is itself a secret whose safe delivery was the original problem. Vault people call this secret zero. Shortening the token's life narrows the window without changing the shape.

Behind delivery sits trust. The sandbox runs code nobody reviewed, so nothing it says about itself counts as evidence, any credential its code could mint, an impostor's code could mint identically. The job still requires trusting requests that come out of this machine, since the point of the machine is work with real consequences. The way through is to relocate the testimony. The platform that booted the sandbox knows exactly which sandbox it is, and trusting the platform costs nothing new, it already runs the hypervisor. Let the platform vouch.

## Asserting the identity

Attestation is that vouching made mechanical. The platform signs a statement about the machine it booted, the secret store verifies the signature against the platform's published keys, and nothing pre-shared sits in the environment. Fly Machines show the shape. Any process on a machine can request an OIDC token over a local socket, and the claims inside name the app, the machine ID, and the digest of the image that booted, so the token attests what code is running, not just which machine asked. It expires in minutes and works only for the audience it names. The sandbox carries the document and can't author it. Steal one and you've stolen an ID card that lapses before you get it home.

None of this is new machinery. Every app in [my cluster](/blog/posts/how-i-use-infisical/) authenticates to Infisical with the service account token Kubernetes projects into its pod, and no credential is stored anywhere. GitHub Actions normalized the same move for CI in 2021, and Infisical will verify assertions from Kubernetes, AWS, GCP, Azure, and any OIDC, JWT, or SPIFFE issuer, so the verifying side is a purchase, not a project. What's new is the machine on the asserting side. These sandboxes belong to users rather than platform teams, and one developer parks dozens of them a week.

## What the identity unlocks

Everything downstream of the assertion is policy, and policy needs a subject.

Reads scope first. Infisical's attribute-based policies template the secret path from an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox a private directory under one identity definition, no role minted per machine. Revocation gets the same grain. An identity created at session start and deleted at teardown takes every token it ever issued with it, which is exactly what a fleet of user-owned machines needs, credentials minted per session and revocable one sandbox at a time.

The grants hanging off the identity come in two shapes. Some access is binary, this sandbox may reach the staging database or it may not. A lease enforces that cleanly. Infisical's dynamic secrets mint a per-sandbox database user and destroy it when the lease expires, so an exported copy authenticates nothing by the time anyone reads it, and rotation happens as a side effect of teardown. Dynamic secrets sit behind Infisical's paid tiers. Other access is tiered, how many requests, how fast, at what spend. An inference key gates a meter, not a door, and a stolen copy spends invisibly inside your own usage, so no lease is short enough. Metered resources want a proxy that keeps the real key, injects it after the request leaves the machine, and charges every request to the asserted identity, with a budget where the open-ended bill used to be.

One constraint shapes every one of these derivatives. The sandbox runs unreviewed code and exfiltration is one HTTP request, so anything the agent reads is compromised the moment it reads it. The derivatives answer by being worthless to export, short-lived, scoped to one sandbox, or never inside the machine at all. The identity can afford to be the durable credential in this system because it was never a secret.

## Where the assertion happens

Every sandbox vendor runs an identity system. The differences are in where the assertion happens.

Fly Machines, Modal, and AWS assert inside the machine. Fly's socket answers any process. Modal containers can read an identity token scoped to the individual container, though for Modal Sandboxes it ships disabled. An AWS Lambda MicroVM runs with an IAM execution role, which stops at role granularity, every microVM sharing a role looks like one principal. Vercel, Cloudflare, and Daytona assert at the edge. Vercel's egress firewall staples a signed token naming the sandbox onto requests it forwards to a proxy you run. Cloudflare's supervising Worker knows which sandbox is calling and applies per-sandbox policy while the code inside holds nothing. Daytona hands the sandbox per-sandbox placeholders and substitutes real values at its proxy, only for hosts on each secret's allowlist. The assertion is the same, made by the platform at the boundary instead of by the workload inside.

Sprites, the machine Fly sells for agents, documents no in-machine identity, so I went looking for an undocumented one. The Machines socket lives at `/.fly/api`, and inside a sprite the directory doesn't exist, `find` across the filesystem matches nothing, and no FLY or OIDC environment variable appears anywhere. Fly moved the entire assertion to the edge rather than omitting it. Connectors hold the provider tokens and apply policy per sprite. One company builds both ends of the spectrum, and its agent product picked the edge.

## What survives suspension

These machines live for weeks of wall clock and hours of actual runtime, and store tokens age on the wall clock. A sandbox suspended past its token's TTL wakes up unauthenticated, which is the alignment you want, credentials bound to runtime instead of calendar time. The parked machine holds nothing worth stealing.

The derivatives are supposed to die while parked. The identity comes back, and by a different mechanism than the filesystem. The disk returns because the platform checkpointed it. The identity returns because the machine proves itself again at wake, so the assertion path has to survive restore as reliably as the disk does. One wrinkle survives from the old world, IP allowlists, the classic hardening for machine credentials, break exactly when a microVM resumes on a different host with a different egress address. Every rule here was written for a machine that either runs or dies, and this machine does neither.

## What I'm building

I [closed the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. The bootstrap chain settles what that means. Each agent's sandbox asserts an identity its platform vouches for. The store verifies the assertion and scopes every read to that sandbox's own path. Binary grants arrive as leases that die at teardown, tiered grants sit behind a proxy with a budget, and anything the agent actually read gets rotated on sight, which stays cheap because every grant was scoped to one sandbox to begin with.

If you're evaluating these platforms, the question list is one item long. Where does a sandbox's identity get asserted, inside the machine or at its edge? Fly Machines, Modal, and AWS answer inside. Vercel, Cloudflare, Daytona, and Sprites answer at the edge. Either answer bootstraps real secret management. No answer means injected copies, a vault in your control plane, and secret zero for the life of the fleet. Ask the question before you park a fleet.
