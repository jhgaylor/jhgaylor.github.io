# Outline: Prove yourself and hold nothing (v2)

Restructured 2026-07-29 per Jake's direction. No camps. The post is organized around the secret requirements of agentic systems, and the vendors show up as evidence that everyone is building pieces of one system. v1 outline (two-camps spine) is in git history.

Working title "Prove yourself and hold nothing". Description candidate: "An agent sandbox needs an identity of its own, borrowed money, and borrowed access. Each wants a different kind of secret, and two of them barely want a secret at all."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image `/images/og/prove-yourself-and-hold-nothing.jpg` (needs generating), permalink `/blog/posts/prove-yourself-and-hold-nothing/`, date TBD. Folder renames to match slug at ship time if the title holds.

Links budget (each post linked exactly once):

- new-kind-of-computer (intro)
- how-i-use-infisical (identity section, Kubernetes auth already running)
- secrets-have-names (closing, pays off the teased next step)

## 1. Intro (no header)

The sandbox from the last post needs a credential inside the first few minutes of any real job. "The sandbox needs secrets" flattens three requirements with nothing in common. An identity of its own. Permission to spend money. Access to systems that hold real data. Each wants a different kind of secret, two barely want a secret at all.

## 2. Seen means compromised

- The rule that shapes everything. Unreviewed code, exfiltration is one HTTP request, so any secret the agent can read is one you should already be rotating.
- The design question for every credential becomes what a stolen copy is worth. The rest of the post answers it per class.

## 3. The identity is the only secret an agent should own

- Ownership cut first. Minted for the agent, boots with it, dies with it. Everything else is borrowed.
- Secret zero compressed (injection rebuilds the vault in the control plane; the credential that fetches secrets is itself a secret).
- Done right the identity isn't a secret. Attestation, the platform signs a statement about the machine, the store verifies with the platform. A Fly Machines OIDC token is mintable only inside that machine, audience-bound, minutes long. A stolen copy is nearly worthless. Identity documents, not secrets.
- Already running in my cluster (link how-i-use-infisical), Kubernetes auth, zero stored credentials. GitHub Actions normalized this for CI in 2021.
- Infisical's attested methods (K8s, AWS, GCP, Azure, OIDC, JWT, SPIFFE JWT-SVID). ABAC path templating per sandbox off an attested claim. Identity lifecycle per sandbox via API, delete revokes every token.
- Platform survey as evidence. Fly Machines (image_digest, best claims), Modal (container_id, off by default for Sandboxes), AWS MicroVMs (execution role, role granularity caveat), Vercel (firewall staples sandbox_id token to forwarded egress).
- Sprites socket hunt stays as the empirical beat. Fly gives Machines the best identity surveyed and strips it from the agent product. Keep the finding, drop the "camps" conclusion, the read is now that Sprites assumes the valuables never live in the machine, which the next two sections justify.

## 4. Secrets that gate money

- Inference keys. The theft is invisible. A stolen database credential announces itself, foreign IP, queries the app never makes. A stolen inference key hides inside your own usage, and agent spend is already bursty and unattributable, so there is no anomaly signal, the meter just runs faster.
- Possession is unacceptable at any TTL. The proxy is the answer, and secrecy is only half of what it buys. Per-sandbox attribution and a budget live at the proxy. The exportable artifact becomes a session token useful only through the policy point.
- The toolbox everyone built: Infisical Agent Vault (HTTPS_PROXY, creds injected on the wire, "agents should never see the underlying secret in the first place"), Cloudflare ("no token is ever granted to an untrusted user for any amount of time"), Daytona placeholders with allowlisted substitution and response scrubbing, Sprites Connectors, Vercel brokering.

## 5. Secrets that gate access

- Database credentials. Theft announces itself, so possession is tolerable if the copy dies fast.
- Short-lived per-sandbox leases. Infisical dynamic secrets, per-lease DB user, provider-side revocation at lease end, renewal capped at creation plus max TTL. The credential the sandbox leaks into a log is dead before anyone reads it.
- Rotation as a side effect of teardown. Blast radius is one sandbox.
- Honesty beat, dynamic secrets and custom roles and IP allowlists sit behind paid tiers.

## 6. The parked machine holds nothing

- Reframe from v1. Tokens expiring while the machine is parked is the correct default, not breakage. Wall-clock lifespan is weeks, runtime is hours, credentials should bind to runtime.
- Wake requires re-attestation, so the identity path has to survive restore the way the filesystem does. Platform OIDC tokens run about an hour, which forces the discipline.
- The genuine wrinkle stays: IP allowlists break when the microVM resumes on a different host.
- Runs-or-dies line closes the section.

## 7. What I'm building (closing)

- Pays off the secrets-have-names teaser (link).
- The decision rule stated compactly. The identity is attested and never distributed. Money is proxied with a budget and a name on every request. Access is leased and dies with the sandbox. Anything the agent actually saw gets rotated, so rotation stays reflex-cheap.
- Directive ender aimed at operators, exact wording at draft time.

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs, recap openers, aphorism enders, braided sentences.
- Each prior post linked at most once. Ravi not mentioned or past tense only.
- Verify at publish time: Modal Sandbox OIDC still opt-in, Lambda MicroVMs GA framing, Infisical ABAC claim mapping still OIDC/K8s/AWS only.
