# Outline: Prove yourself or hold nothing

Working title. Alternates considered and parked ("How the new computer earns its secrets", "Nobody agrees how the sandbox gets secrets"). Description candidate for front matter: "The agent sandbox runs code nobody reviewed and still needs credentials. The vendors split into two camps over how it gets them, and my secret store builds for both."

Intended front matter when it ships to `blog/posts/`: layout `layouts/blog.html`, tags `["posts"]`, og_image `/images/og/sandbox-secrets.jpg` (needs generating), permalink `/blog/posts/prove-yourself-or-hold-nothing/`, date TBD.

Links budget (each post linked exactly once):

- new-kind-of-computer (intro, "the sandbox I wrote about")
- how-i-use-infisical (Kubernetes auth already running in my cluster)
- secrets-have-names (closing, the teased next step this post pays off)
- agent-ready-infrastructure or micro-vms only if a sentence earns it, otherwise skip

## 1. Intro (no header)

The sandbox from last week's post needs a real credential inside the first few minutes of any useful job. The machine's fourth property (runs code nobody reviewed) collides with the job's first requirement (hold a token that can do damage). Frame the question of the post: how does a machine that just booted, owned by a user, running unreviewed code, get secrets?

## 2. Secret zero, again

- The obvious answer is injection at create time. What injection costs you (copies of long-lived creds, no per-sandbox revocation, control plane becomes the vault).
- Name the bootstrap problem. The credential that fetches secrets is itself a secret. Vault-era name for it.
- The way out in one sentence, identity derived from attestation instead of distributed as a secret. The machine proves what it is with something the platform gave it for free, the store checks with the platform.

## 3. The store side is ready

- My cluster already runs this shape. Kubernetes auth, projected SA token, TokenReview, zero stored credentials (link how-i-use-infisical).
- Infisical's 13 auth methods sort by pre-shared vs platform-attested. Attested list: Kubernetes, AWS, GCP, Azure, OIDC, JWT, SPIFFE (JWT-SVID only). Universal Auth's client secret is pre-shared and their own blog says it stays secret zero.
- OIDC auth mechanics in two sentences (JWKS, bound iss/sub/aud/custom claims, globs).
- ABAC is the piece that fits "machines that belong to users". Path templated off an attested claim, `/{{identity.metadata.sandboxId}}/**`, one identity definition covers the fleet, minted at session start and revocable one sandbox at a time via plain API calls.
- describeSecret vs readValue (names free, values guarded, carries over from the delegation post without relinking it).
- Dynamic secrets for the strongest version, per-sandbox DB user that dies with the lease. Honesty beat, dynamic secrets and custom roles and trusted IPs sit behind paid tiers.

## 4. The machine side is split

- Fly Machines. OIDC over a local Unix socket, custom audience, claims down to machine_id and image_digest. Image digest attests what code is running, not just where. Strongest claim set in the survey.
- Modal. MODAL_IDENTITY_TOKEN down to container_id, documented federation to AWS and Vault, disabled by default for Sandboxes.
- AWS Lambda MicroVMs. Execution role creds, signed GetCallerIdentity works day one. Granularity caveat, identity is the role, sibling microVMs indistinguishable, per-VM payload is injection not attestation.
- Vercel Sandbox. No ambient token inside. The firewall attaches a Vercel-signed token with sandbox_id/project_id/team_id to egress it forwards to a proxy you run. Genuine per-sandbox attestation, delivered to the wrong party for our purposes, useful anyway.

## 5. I went looking for the socket

- Empirical beat. Spun up a Sprite, looked for /.fly/api. ls, test -S, find across the filesystem, env scan. Nothing.
- The asymmetry is the finding. Fly gives platform machines the best identity surveyed and gives agent sandboxes none. Subtraction as a design statement.

## 6. The other answer says hold nothing

- Cloudflare's sentence, "no token is ever granted to an untrusted user for any amount of time". Secrets stay in the Worker, egress proxy injects.
- Daytona Secrets, placeholder `dtn_secret_<random>` inside, proxy substitutes real value only for allowed hosts, scrubs echoes from responses.
- Sprites Connectors, OAuth gateway, same camp.
- The rationale stated fairly. Attestation authenticates the machine and says nothing about what unreviewed code does with the value after the read. Exfiltration is one HTTP request.
- Infisical builds for this camp too. Agent Vault, session token plus HTTPS_PROXY, real credential injected on the wire, their line "agents should never see the underlying secret in the first place". Credential brokering blog cites Vercel, Cloudflare, Anthropic converging on the same design.

## 7. Suspension breaks the tokens too

- Access token TTLs are wall clock. A sandbox parked past its TTL wakes up unauthenticated.
- Re-login needs a fresh platform token and platform OIDC tokens run minutes long, so wake requires re-attestation, which means the identity path has to survive restore.
- Renewal caps at creation plus max TTL, long sessions re-auth on a clock no one set deliberately.
- Trusted-IP allowlists break exactly when the microVM resumes on a different host.
- Callback to the gauges section without relinking the post. Ten years of tooling assumes a process either runs or dies, secrets tooling included.

## 8. What I'm building (closing)

- Pays off the secrets-have-names teaser (link), my agents were next in line for identities of their own.
- The concrete plan. On platforms that attest, one Infisical OIDC identity per agent, path scoped by claim, minted and revoked by the same control loop that creates the sandbox. On platforms that don't, the credential never enters the machine and a proxy signs on its behalf.
- Directive ender. Ask your sandbox vendor which camp it's in, the answer decides where your secrets live. (Exact wording at draft time, must land concrete, no aphorism.)

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs, recap openers, aphorism enders, braided sentences.
- Each prior post linked at most once. Ravi not mentioned or past-tense only.
- Verify at publish time: Modal Sandbox OIDC still opt-in, Lambda MicroVMs still GA-described as June 2026, Infisical ABAC claim mapping still OIDC/K8s/AWS only.
