# Prove yourself or hold nothing

*Draft for jakegaylor.com, 2026-07-29. Intended permalink /blog/posts/prove-yourself-or-hold-nothing/.*

*The agent sandbox runs code nobody reviewed and still needs credentials. The vendors split into two camps over how it gets them.*

The [new kind of computer](/blog/posts/new-kind-of-computer/) needs a GitHub token within the first few minutes of any real job. An agent that can't authenticate to anything is a safe machine doing no work, so every one of these sandboxes ends up holding credentials, and the code deciding what to do with them arrived at runtime from a model. Every platform in that post has to answer the same question. How does a machine that just booted, owned by a user, running code nobody reviewed, get its secrets?

## Secret zero, again

The obvious answer is injection. The control plane that creates the sandbox pastes a token into the environment, the same way you'd hand a CI job its deploy key. It works, and it quietly rebuilds everything I spent this year migrating away from. The control plane becomes a vault, holding long-lived copies of every credential any sandbox might need. Each injected token is a copy with no identity of its own, so revoking one sandbox means rotating everyone. And the token was minted before the code it needs protecting from ever ran.

The secrets world has a name for the deeper problem. To fetch its secrets from the store, the sandbox needs a credential for the store, and delivering that credential is the same problem you were trying to solve. Vault people call it secret zero. The way out is to delegate the machine's authentication to infrastructure you already trust. The machine proves what it is with something the platform gave it for free, and the store checks the proof with the platform. Identity gets derived from attestation instead of distributed as a secret.

## The store side is ready

This shape already runs in [my cluster](/blog/posts/how-i-use-infisical/). Every app authenticates to Infisical with the service account token Kubernetes projects into its pod, Infisical verifies that token against the Kubernetes API, and no credential is stored anywhere. The pattern predates agents. GitHub Actions made it normal for CI back in 2021.

Infisical ships thirteen ways in the door, and they sort cleanly by whether the thing presented was pre-shared or platform-attested. Kubernetes, AWS, GCP, and Azure auth check with the platform that issued the ambient credential. OIDC and JWT auth verify a signed token from any issuer you configure. SPIFFE auth accepts JWT-SVIDs from a SPIRE deployment. On the other side of the line sit Universal Auth and Token Auth, where the client secret is a pre-shared value, and Infisical's own writing positions those as the thing the attested methods exist to replace.

OIDC auth is the general-purpose door. The sandbox presents a JWT its platform signed, Infisical fetches the issuer's public keys, and login succeeds only if the issuer, subject, audience, and any custom claims match what you bound to the identity. Globs are allowed in the bindings, and the docs tell you to hardcode instead.

The piece that fits machines that belong to users is attribute-based access control. A policy can template the secret path off a claim the platform attested, so `/{{identity.metadata.sandboxId}}/**` scopes each sandbox to its own directory while one identity definition covers the whole fleet. Nothing stops you from minting a real identity per sandbox either. The create, scope, and delete calls are plain API endpoints. Deleting the identity revokes every token it ever held. Minted at session start, revocable one sandbox at a time, which is exactly the requirement the sandbox post wrote down.

The strongest version hands over no stored value at all. Dynamic secrets mint a per-lease database user that Infisical destroys when the lease expires, so the credential the sandbox leaks into a log is dead before anyone reads it. The honest footnote is that dynamic secrets, custom roles, and IP allowlists all sit behind paid tiers.

## The machine side is split

Whether the sandbox can produce that JWT is up to the vendor, and the survey splits down the middle.

Fly Machines carry the best identity I found. Any process on a machine can request an OIDC token over a local Unix socket, with an audience of its choosing, and the claims include the app, the machine ID, the region, and the image digest. The digest is the interesting claim. It attests what code booted, not just which machine is asking. Modal comes close, containers can read a MODAL_IDENTITY_TOKEN scoped down to the individual container ID with documented federation into AWS and Vault, though for Modal Sandboxes the token is off by default. AWS Lambda MicroVMs get there with older machinery. The microVM runs with an IAM execution role, the SDK credential chain works inside, and a signed GetCallerIdentity is all Infisical's AWS auth needs. The catch is granularity. The identity is the role, so every microVM sharing an execution role is the same principal to a verifier, and the documented way to tell them apart is a payload the control plane injects at launch.

Vercel Sandbox is the hybrid. Code inside gets no ambient token, and the platform is explicit that sandboxes exist to run untrusted code. But the egress firewall can forward matching requests to a proxy you operate, and it staples a Vercel-signed token to each one carrying the team, project, and sandbox IDs. Genuine per-sandbox attestation, delivered to your proxy instead of your sandbox.

## I went looking for the socket

Sprites, the product Fly aims at exactly this workload, documents none of that. The Machines OIDC socket lives at `/.fly/api`, so I spun up a sprite and went looking. The directory doesn't exist. `find / -iname "*.fly*"` matches nothing. There are no FLY or OIDC environment variables and no Unix socket anywhere on the filesystem with fly or oidc in its path, on the same platform that puts the socket on every Machine.

Fly built the strongest workload identity in this survey and left it out of the machine it sells for agents. Sprites route outbound API access through Connectors instead, an OAuth gateway that holds the provider tokens itself and applies policy per request. Fly looked at the two camps and put its agent product in the second one.

## The other answer says hold nothing

Cloudflare wrote the second camp's position down in one sentence, "no token is ever granted to an untrusted user for any amount of time." Secrets live in the Worker that supervises the sandbox, an egress proxy injects them into outbound requests, and the sandbox's identity exists only on the supervisor's side of the boundary. Daytona builds the same idea into its Secrets product. The environment variable inside the sandbox holds a placeholder starting with `dtn_secret_`, an outbound proxy substitutes the real value only for hosts on that secret's allowlist, and responses that echo the real value get scrubbed back to the placeholder on the way in.

The rationale deserves a fair reading. Attestation authenticates the machine and says nothing about what the code inside will do with a value once it reads one. The whole premise of the sandbox is that nobody reviewed that code. Exfiltration is one HTTP request, and a credential that never enters the machine can't leave it.

Infisical builds for this camp too. Agent Vault, open sourced in April, gives the agent a session token and an HTTPS_PROXY variable, terminates TLS locally, and injects the real credential on the wire after the request leaves the agent's process. In their words, "agents should never see the underlying secret in the first place." Their credential brokering post lists Vercel, Cloudflare, and Anthropic converging on the same design from different directions.

## Suspension breaks the tokens too

Both camps still have to survive this machine's duty cycle, and tokens age on wall-clock time. An Infisical access token defaults to a 30-day TTL, configurable down to minutes, and a sandbox suspended past its expiry wakes up unauthenticated. Logging back in takes a fresh platform token, and platform OIDC tokens run about an hour at best, so a machine restored after a weekend has to re-attest before its first secret read. The identity path has to survive restore the same way the filesystem does. Renewals have a ceiling too. A token can be extended any number of times but never past its creation time plus the max TTL, so a session that lives for weeks re-authenticates on a clock nobody set deliberately. And IP allowlists, the classic hardening move for machine credentials, break exactly when the microVM resumes on a different host with a different egress address.

None of this is broken behavior. Every rule made sense for a machine that either runs or dies, and this machine does neither.

## What I'm building

I [closed the delegation post](/blog/posts/secrets-have-names/) with a promise that my agents were next in line for identities of their own. The research settled what that looks like. On a platform that attests, each agent's sandbox gets an Infisical identity that logs in with the platform's token, scoped by claim to its own secret path, created and destroyed by the same control loop that creates and destroys the sandbox. On a platform that withholds, the agent gets a proxy and placeholders, and the real values never cross the boundary at all. Both patterns run against the store I already operate.

If you operate these machines, ask your vendor whether code inside a sandbox can prove which sandbox it is. Fly Machines, Modal, and AWS answer yes. Sprites, Daytona, E2B, and Cloudflare answer no on purpose. That answer sorts every secret you own into fetched or injected, and you want to know which side of the line you live on before the first token leaks.
