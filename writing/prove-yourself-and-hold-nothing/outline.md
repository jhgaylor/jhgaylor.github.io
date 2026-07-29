# Outline v3: identity bootstraps everything

Reshaped 2026-07-29 after Jake's thesis pivot (see thinking.md). v1 (two camps) and v2 (three secret classes) are in git history.

**Thesis, Jake's words:** secret management for agentic sandboxes relies on us somehow asserting the sandbox's identity so that we can then bootstrap secret management.

**Thesis, essay form:** every mechanism for getting secrets to a sandbox safely (leases, proxies, scoped paths, budgets, per-sandbox revocation) is a policy decision, policy needs a subject, and "which sandbox is asking" is the input they all consume. Assert the identity and everything bootstraps from it. Skip it and you're injecting long-lived copies, which is secret zero wearing a control plane.

Working title TBD. "Prove yourself and hold nothing" reads taxonomy-first and probably retires. Shapes to try at draft time: the bootstrap/name angle ("Secret management starts with the sandbox's name", "The sandbox has to say who it is first"). Description candidate: "Leases, proxies, scoped reads, and budgets are all policy, and policy needs a subject. Every secrets design for agent sandboxes bootstraps from asserting which sandbox is asking."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD. Folder renames at ship time.

Links budget (each post linked exactly once):

- new-kind-of-computer (intro)
- how-i-use-infisical (attestation precedent in my cluster)
- secrets-have-names (closing payoff)

## 1. Intro (no header)

Call it what it is, bootstrapping. The dependency chain is the hook, stated as a ladder: the job needs secrets, the secrets need a store, and the store needs to know who's asking. The identity is the only rung the platform can supply for free, so it's where the whole chain bootstraps from. State the thesis plainly, then promise the tour: why injection fails, how assertion works, what it unlocks, who can do it today. (Jake killed the "needs a credential in minutes" urgency framing, 2026-07-29.)

## 2. Secret zero (why the naive answer fails)

- Injection at create time rebuilds the vault inside the control plane. Long-lived copies, no per-sandbox revocation.
- The bootstrap problem named: the credential that fetches secrets is itself a secret. Secret zero.
- The escape is categorical, not incremental: the first credential must not be a secret at all. It must be an assertion someone else can verify.

## 3. Asserting the identity (the mechanism)

- Attestation: the platform signs a statement about the machine, the verifier checks with the platform, nothing pre-shared sits in the environment.
- Stolen-copy property: a Fly Machines OIDC token is mintable only inside the machine, audience-bound, minutes long. An ID card that expires before it gets home. Identity documents, not secrets.
- Precedent: my cluster (link how-i-use-infisical), Kubernetes service account tokens, zero stored credentials. GitHub Actions normalized it for CI in 2021.
- Store side is buyable: Infisical verifies K8s/AWS/GCP/Azure/OIDC/JWT/SPIFFE assertions. Keep to one sentence; the two details that earn themselves (ABAC path templating, delete-revokes-all) live in section 4.

## 4. What the identity unlocks (the bootstrap payoff)

- Everything downstream is policy applied to the asserted subject.
- Scoped reads: ABAC templates the secret path off an attested claim, `/{{identity.metadata.sandboxId}}/**`, one definition covers the fleet.
- Per-sandbox revocation: identity minted at session start, deleted at teardown, deleting it kills every token it held. The requirement the sandbox post wrote down.
- Binary grants: can this sandbox reach the database at all. Enforced with short-lived leases (dynamic secrets, per-lease DB user, dead on export, rotation as a side effect of teardown).
- Tiered grants: how much, how fast, at what budget. Enforced at a proxy that holds the real key, injects it on the wire, and charges every request to the asserted identity. Inference keys as the example, one or two sentences on why possession fails for metered resources (stolen usage hides inside your own).
- The seen-means-compromised constraint threads here: derivatives are short-lived, scoped, or withheld because anything the agent reads is compromised on sight. The identity is the one durable credential precisely because it isn't a secret.

## 5. Where the assertion happens (the survey, unified)

- The industry does not disagree about whether the sandbox needs an identity. It disagrees about where the assertion happens.
- Inside the machine: Fly Machines (socket, claims down to image digest), Modal (container-scoped, off by default for Sandboxes), AWS MicroVMs (execution role, role granularity caveat).
- At the edge: Vercel's firewall staples a signed sandbox_id to forwarded egress. Cloudflare's supervisor Worker knows ctx.containerId and applies policy per sandbox. Daytona's placeholders are per-sandbox substitutions at the proxy. All identity assertions, made by the platform at the boundary instead of by the workload inside.
- Sprites hunt stays as the empirical beat, reread: no socket, no env vars, nothing inside. Fly didn't skip identity, they put all of it in the control plane and none of it in the machine. Same company asserts inside on Machines and at the edge on Sprites.

## 6. Suspension (identity is the durable credential)

- Weeks of wall clock, hours of runtime. Store tokens age on the wall clock, so the parked sandbox wakes unauthenticated, and that's alignment, not breakage.
- The derivatives are supposed to die while parked. The identity survives because it's re-derivable: filesystem survives by checkpoint, identity survives by re-proof. The assertion path has to survive restore the way the disk does.
- Honest wrinkle: IP allowlists break on cross-host resume. Runs-or-dies line closes.

## 7. What I'm building (closing)

- secrets-have-names payoff (link): my agents' identities, minted by the platform, verified by the store, dead with the sandbox, with every grant (binary or tiered) hanging off them.
- Vendor question collapses from two to one: how does your platform let a sandbox's identity be asserted, inside the machine or at its edge? Who answers what, from the survey.
- Ender: concrete claim about the bootstrap being the whole game, exact wording at draft time. No aphorism.

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs, recap openers, aphorism enders, braided sentences.
- Each prior post linked at most once. Ravi not mentioned or past tense only.
- Target 1,100–1,300 words per the meta-analysis findings (inventory compressed to payoff-bearing sentences).
- Verify at publish time: Modal Sandbox OIDC still opt-in, Lambda MicroVMs GA framing, Infisical ABAC claim mapping still OIDC/K8s/AWS only.
