# Prove yourself and hold nothing

*Draft v2 for jakegaylor.com, 2026-07-29. Intended permalink /blog/posts/prove-yourself-and-hold-nothing/. v1 (two-camps structure) is in git history.*

*An agent sandbox needs an identity of its own, borrowed money, and borrowed access. Each wants a different kind of secret, and two of them barely want a secret at all.*

The [new kind of computer](/blog/posts/new-kind-of-computer/) needs a credential within the first few minutes of any real job. An agent that can't authenticate to anything is a safe machine doing no work. But "the sandbox needs secrets" flattens three requirements with nothing in common. The agent needs an identity of its own. It needs permission to spend my money. And it needs access to systems that hold real data. Each wants a different kind of secret, and two barely want a secret at all.

## Seen means compromised

One rule shapes everything downstream. The sandbox runs code nobody reviewed, exfiltration is one HTTP request, and no scanner reliably catches a value leaving base64-encoded in a query string. So any secret the agent can read is a secret you should already be rotating. My agents have been careful so far and the rule doesn't care, it's a design constraint, not a judgment of their character.

Under that rule, hiding the value is table stakes. The question that sorts every credential is what a stolen copy is worth, and the three requirements give three different answers.

## The identity is the only secret an agent should own

The ownership cut comes first. An agent's identity credential is minted for it, boots with it, and should die with it. Everything else the agent touches is borrowed, from me, from my org, from the providers I pay. Blurring that line is how you end up with an agent working through a human's login and carrying every permission the human has.

The identity is also the bootstrap. To fetch anything from a secret store, the sandbox needs a credential for the store, and delivering that credential is the problem you were trying to solve. Vault people call it secret zero. Injecting a store token at create time rebuilds the vault inside the control plane, one long-lived copy per sandbox, revocable only by rotating everyone at once.

The way out is that the identity doesn't have to be a secret. The platform signs a statement about the machine, the store verifies the signature with the platform, and nothing pre-shared sits in the environment. This already runs in [my cluster](/blog/posts/how-i-use-infisical/), where every app authenticates to Infisical with the service account token Kubernetes projects into its pod. GitHub Actions normalized the same move for CI back in 2021.

The sandbox platforms are partway there. Fly Machines hand any process an OIDC token over a local Unix socket, with an audience of its choosing and claims down to the machine ID and the image digest, so the token attests what code booted, not just which machine asked. Steal one and you've stolen an ID card that expires in minutes and only works for the one audience it names. Modal issues container-scoped identity tokens with documented federation into AWS and Vault, though for Modal Sandboxes they're off by default. AWS Lambda MicroVMs run with an IAM execution role, which gets you in the door and stops at role granularity, every microVM sharing a role is the same principal to a verifier. Vercel Sandbox keeps tokens out of the machine entirely and staples a signed sandbox identity to egress requests its firewall forwards to a proxy you run.

On the store side this is a solved buy. Infisical verifies Kubernetes, AWS, GCP, Azure, OIDC, JWT, and SPIFFE identities, and its attribute-based policies template the secret path off an attested claim, so `/{{identity.metadata.sandboxId}}/**` gives every sandbox its own directory under one identity definition. Minting and revoking per sandbox is plain API calls, and deleting an identity kills every token it ever held.

Sprites documents none of this, so I went looking. The Machines socket lives at `/.fly/api`, and inside a sprite the directory doesn't exist, `find / -iname "*.fly*"` matches nothing, and no FLY or OIDC environment variable appears anywhere. Fly built the best workload identity I surveyed and left it out of the machine it sells for agents. The subtraction looked like a contradiction until I sorted the borrowed secrets by what they gate.

## Secrets that gate money

An inference key is a license to spend. When one leaks, the thief breaks nothing, trips no alert, touches no table your app never reads. The stolen usage hides inside your own, and agent workloads make the camouflage perfect because legitimate agent spend is already bursty and hard to attribute. Nobody notices the meter running faster until the invoice does.

Short TTLs don't help here. The agent needs inference for its whole session, so the credential is alive whenever the agent is, and every minute it's alive a copy can spend invisibly. The fix is that the key never enters the machine. The agent talks through a proxy, the proxy holds the real credential and injects it after the request leaves the sandbox, and now every request carries a name. Attribution and a budget live at the proxy. What the sandbox holds is a session token that works only through the policy point, so a thief who exports it inherits a rate limit and an audit log instead of my inference bill.

The tooling for this shipped across the industry within about a year. Infisical's Agent Vault gives the agent an HTTPS_PROXY and injects credentials on the wire, in their words "agents should never see the underlying secret in the first place." Cloudflare runs secrets on the Worker side of the boundary and states the position plainly, "no token is ever granted to an untrusted user for any amount of time." Daytona sets the environment variable to a placeholder, substitutes the real value only for hosts on that secret's allowlist, and scrubs echoes of the real value out of responses on the way back in. Sprites route outbound API access through Connectors, an OAuth gateway that holds the provider tokens itself. Which resolves the Sprites contradiction, Fly assumes the valuables never live in the machine at all.

## Secrets that gate access

A database credential leaks differently. The thief has to use it somewhere, from an address you've never seen, running queries your app never runs. The theft announces itself, so possession inside the sandbox is tolerable if the copy dies fast.

Short-lived leases deliver that. Infisical's dynamic secrets mint a per-lease database user and destroy it provider-side when the lease expires, with renewals capped at the lease's max TTL. The agent holds a real credential, and by the time an exported copy travels anywhere it authenticates nothing. Scoping the lease to one sandbox bounds the blast radius to one sandbox, and rotation happens as a side effect of teardown. The honest footnote from my research is that dynamic secrets, custom roles, and IP allowlists all sit behind Infisical's paid tiers.

## The parked machine holds nothing

The machine's duty cycle enforces all of this whether you planned for it or not. These computers live for weeks of wall-clock time and hours of actual runtime, and secret-store tokens age on the wall clock. A sandbox suspended past its token's TTL wakes up unauthenticated, which is the alignment you actually want, credentials bound to runtime instead of wall clock. The parked machine holds nothing worth stealing.

Waking up means re-attesting. The platform token that logs an identity back in runs about an hour at best, so the path that mints a fresh proof has to survive restore the same way the filesystem does. One genuine wrinkle remains, IP allowlists, the classic hardening move for machine credentials, break exactly when a microVM resumes on a different host with a different egress address. Every rule here made sense for a machine that either runs or dies, and this machine does neither.

## What I'm building

I [closed the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. Sorting the requirements settled what that means. The identity is attested and never distributed, minted by the platform, verified by the store, dead when the sandbox dies. Money is proxied, a budget and a name on every request, the key never inside the machine. Access is leased, scoped to one sandbox, revoked at teardown. And anything an agent actually saw gets rotated on sight, which stays cheap precisely because everything above is scoped small.

Ask two questions of any sandbox platform you're evaluating. Can code inside prove which sandbox it is, and can egress be brokered without the code noticing. Fly Machines, Modal, and AWS pass the first. Cloudflare, Daytona, Sprites, and Vercel pass the second. No product I surveyed passes both, and Fly has already built both halves, the socket on Machines and the broker on Sprites. The first vendor to put them in the same machine ships the secrets story this computer is missing.
