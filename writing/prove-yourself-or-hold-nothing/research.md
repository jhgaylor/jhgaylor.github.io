# Research: how a sandbox earns the right to read secrets (Infisical × agent sandboxes)

Researched 2026-07-29 for the post teased at the end of secrets-have-names ("identities for the agents themselves"), sharpened by new-kind-of-computer: the sandbox is a freshly booted machine that must prove enough about itself to be granted secrets, with no pre-injected credential (the secret-zero problem).

## The thesis the research supports

The field split into two philosophies, and Infisical ships tooling for both:

1. **Attestation** — give the workload a verifiable identity, let it fetch its own secrets. Platforms: Fly Machines, Modal, AWS Lambda MicroVMs, GitHub Actions (prior art). Infisical side: OIDC/JWT/AWS-native auth + bound claims + ABAC templating.
2. **Credential withholding** — the sandbox never holds anything; an egress proxy injects/substitutes real credentials in flight, because attestation doesn't help if legitimately fetched secrets can be exfiltrated by the untrusted code. Platforms: Cloudflare (explicitly anti-token), Daytona Secrets (placeholder substitution), Fly Sprites Connectors, Vercel brokering. Infisical side: **Agent Vault** (open-source credential proxy, 2026-04-22) + credential brokering.

Vercel Sandbox is the hybrid: withholding by default, but the firewall attaches a genuine per-sandbox attestation token (`vercel-sandbox-oidc-token` with `sandbox_id`, `project_id`, `team_id` claims) to forwarded egress requests — delivered to a proxy you run, never as an ambient bearer in the VM.

Connective tissue back to new-kind-of-computer: suspend/resume breaks the token mechanics (wall-clock TTLs expire while parked; renewal caps at creation+maxTTL; trusted-IP binding breaks when the VM resumes on a different host; the platform OIDC token needed to re-login is minutes-long and must be re-issuable at wake). And "machines that belong to users": ABAC lets one identity template scope per-sandbox secret paths off an attested claim instead of minting a role per sandbox.

---

## Report 1: Infisical machine identity & auth

Machine identities overview: https://infisical.com/docs/documentation/platform/identities/machine-identities — every method exchanges a credential for a short-lived Infisical access token (except Token Auth, which IS the token). 13 methods total.

| Method | Workload presents | Infisical verifies | Solves secret zero? |
|---|---|---|---|
| **Token Auth** (docs/documentation/platform/identities/token-auth) | Pre-generated access token used directly | Token validity, TTL, max uses, trusted IPs | **No** — minted in UI, must be injected |
| **Universal Auth** (…/universal-auth) | Client ID + Client Secret to `/api/v1/auth/universal-auth/login` | Secret match, client-secret trusted IPs, secret TTL/max-uses | **No** — pre-shared. Mitigations: client secrets with own TTL and max-number-of-uses (single-use bootstrap), optional "Access Token Period" for indefinitely renewable periodic tokens |
| **Kubernetes Auth** (…/kubernetes-auth) | Projected SA JWT | TokenReview API (3 reviewer modes incl. Infisical Gateway); allowed SA names, namespaces, audience | **Yes** |
| **AWS Auth** (…/aws-auth) | SigV4-signed `sts:GetCallerIdentity` | Forwards to STS; allowed principal ARNs + account IDs | **Yes** — ambient IAM creds |
| **GCP Auth** (…/gcp-auth) | ID token from metadata server or signJwt | Google certs; allowed SA emails, projects, zones | **Yes** |
| **Azure Auth** (…/azure-auth) | Managed-identity JWT from IMDS | Azure AD OpenID config; tenant, allowed SP IDs | **Yes** |
| **OIDC Auth** (…/oidc-auth/general) | JWT from any OIDC provider | Discovery URL → JWKS; iss, sub, aud, custom claims (glob-matchable) | **Yes, if platform issues workload identity tokens** (GitHub, GitLab, TFC, CircleCI, SPIRE sub-guides exist) |
| **JWT Auth** (…/jwt-auth) | JWT from any issuer | JWKS URL **or static PEM public keys** (RSA/ECDSA); iss/aud/sub/custom | **Yes, if** issuer is trusted infra. Static-key mode works air-gapped — a control plane can sign its own sandbox-identity JWTs |
| **SPIFFE Auth** (…/spiffe-auth) | **JWT-SVID only** (X.509-SVID explicitly not supported) | Trust bundle (static JWKS or HTTPS bundle from SPIRE, ~1h cache); trust domain, allowed SPIFFE IDs (glob `*`/`**`), audience | **Yes** — attestation delegated to SPIRE |
| **TLS Certificate Auth** (…/tls-cert-auth) | Client cert via mTLS to `/api/v1/auth/tls-cert-auth/login` | Configured CA; allowed CNs, SANs. Needs mTLS-terminating LB; Infisical Cloud port 8443 | **Partial** — cert+key must be provisioned unless SPIRE-like issues it |
| **LDAP Auth** | identityId + LDAP user/pass | Bind + attribute match | **No** |
| **OCI Auth** | Signed request w/ OCI user private key | Forwards to OCI; tenancy, usernames | **No** |
| **Alibaba Cloud Auth** | HMAC-signed GetCallerIdentity | Forwards to AliCloud; allowed ARNs | Delegated to key distribution |

**OIDC deep dive:** POST `{identityId, jwt}` to `/api/v1/auth/oidc-auth/login`; discovery URL → JWKS; validates iss + bound subject + bound audiences + bound custom claims. Globs: `*` matches any chars *including* `:` and `/` (e.g. `repo:my-org/my-repo:ref:refs/heads/*`); docs recommend hardcoding over globs. GitHub example: discovery `https://token.actions.githubusercontent.com`, sub `repo:octocat/example-repo:ref:refs/heads/main`.

**Access token mechanics** (uniform): TTL default 30d; max TTL 30d; renew `POST /api/v1/auth/token/renew` any number of times but **capped at creation+maxTTL**; max-uses default unlimited; trusted-IP CIDR allowlists (**paid feature**); revoke endpoint; deleting the identity revokes all its tokens.

**Suspend/resume hazards:**
- TTL is wall-clock → sandbox suspended past TTL wakes unauthenticated; its login credential (platform OIDC token, typically minutes-long) must be re-issuable at resume.
- Renewal can't cross creation+maxTTL → long sessions forced to re-auth (except Universal Auth periodic tokens).
- Trusted-IP binding breaks exactly when a microVM resumes on a different host/egress IP.

**Programmatic lifecycle — full loop exists:** `POST /api/v1/identities` (with **metadata k/v**), per-method attach/revoke endpoints, Project Identity Memberships API (roles array, `isTemporary` support), `DELETE /api/v1/identities/{id}` revokes all tokens. Terraform: `infisical_identity`, `infisical_identity_oidc_auth`, `infisical_project_identity`, `infisical_project_role`, etc. → a control plane CAN mint one identity per sandbox at session start and revoke at teardown.

**Permissions granularity** (docs/internals/permissions/project-permissions): `describeSecret` vs `readValue` vs create/edit/delete → read vs list separation exists (matches the secrets-have-names "names are free, values are guarded" pattern). Conditions on environment, secretPath, secretName, secretTags, metadata with `$eq/$ne/$in/$glob/$elemMatch`. Custom roles are **Enterprise-only**.

**ABAC** (…/access-controls/abac): policies template on identity attributes, e.g. secret path `/{{identity.metadata.sandboxId}}/**`; attributes from manual identity metadata or **auth-time claim mapping — OIDC claims, Kubernetes, AWS only today** (not JWT auth, not SPIFFE). This is the strongest pattern: one identity template, per-sandbox path derived from an attested claim, no per-sandbox role minting.

**Dynamic secrets** (Enterprise): ~26 providers (Postgres, MySQL, Mongo, Redis, Snowflake, AWS/GCP IAM, Azure Entra, GitHub, K8s SAs, SSH certs, TOTP…). Leases: create `POST /api/v1/dynamic-secrets/leases` → per-lease creds + expireAt; renew capped at creation+maxTTL; early revocation runs provider-side revocation. Fit: sandbox gets a per-sandbox DB user that dies with the lease; real creds never enter the microVM.

**Infisical × agents:** homepage tagline now "The modern security platform for developers and agents." **Agent Vault** (2026-04-22, infisical.com/blog/agent-vault-the-open-source-credential-proxy-and-vault-for-agents): open-source HTTP CONNECT credential proxy; agent gets only a session token + HTTPS_PROXY; proxy TLS-terminates with local CA, injects real creds on the wire; "agents should never see the underlying secret in the first place." **Credential Brokering for AI Agents** (2026-05-23 blog): placeholder substitution (`__github_token__` swapped server-side); cites Anthropic Managed Agents, Vercel, Cloudflare Outbound Workers, LangChain as convergent. **eve on Vercel with zero credentials** (2026-07-09 blog). **Secret-zero blog** (infisical.com/blog/solving-secret-zero-problem): "leverage your existing infrastructure to delegate the authentication of machines." Docs MCP server (docs-only) at infisical.com/docs/ai/model-context-protocol; `mcp-endpoints` permission subject appearing in project permissions.

**Explicit absences:** no TPM/measured-boot/hardware attestation (trust root is always a platform token service); SPIFFE is JWT-SVID only; no sandbox-platform-native auth (Fly/Vercel/Daytona); no Vault-style response-wrapping (closest: max-uses=1 client secrets/tokens); Enterprise/paid gates on dynamic secrets, custom roles, trusted IPs, gateway reviewer; ABAC claim injection only OIDC/K8s/AWS.

---

## Report 2: what each sandbox platform can attest

| Platform | Ambient signed identity inside sandbox? | Verdict for Infisical today |
|---|---|---|
| Vercel Sandbox | No ambient token; per-request OIDC token attached by egress firewall to a proxy you run | **With work** (proxy/broker) |
| AWS Lambda MicroVMs | Yes — IAM execution role creds | **Yes** (AWS Auth) |
| Fly Machines | Yes — OIDC via local socket, custom `aud` | **Yes** (OIDC auth) |
| Fly Sprites | No | **No** — inject or Connectors |
| Daytona | No | **No** — placeholder-substitution Secrets |
| Modal | Yes — `MODAL_IDENTITY_TOKEN` (opt-in for Sandboxes) | **Yes** (OIDC auth) |
| E2B | No | **No** — inject at create |
| Cloudflare Sandboxes | No token by philosophy; identity Worker-side only (`ctx.containerId`) | **No** — Worker proxy injects |

**Vercel:** control-plane OIDC (`VERCEL_OIDC_TOKEN`, iss `https://oidc.vercel.com/[team]`, sub `owner:[team]:project:[proj]:environment:[env]`, 60min TTL, JWKS at `/.well-known/jwks`) identifies the *creating project*, not the sandbox. Inside: no ambient identity (sandboxes are for untrusted code). **Firewall `forwardURL` rules attach `vercel-sandbox-oidc-token`** (aud = the forwardURL; claims `team_id`, `project_id`, `sandbox_id`, `sandbox_name`); `defineSandboxProxy` from `@vercel/sandbox/proxy` verifies and yields meta. Plus "credentials brokering" injecting secrets into egress "while ensuring those secrets never enter the sandbox scope." (vercel.com/docs/oidc, /docs/sandbox/concepts/firewall, /docs/sandbox/sdk-reference)

**AWS Lambda MicroVMs** (GA 2026-06-22): `run-microvm --execution-role-arn`; SDK default credential chain works inside; `/resume` lifecycle hook documented for refreshing creds after restore; `sts:GetCallerIdentity` needs no permissions → **Infisical AWS Auth works today**. Granularity caveat: identity = the role, so every microVM with the same execution role is indistinguishable; per-VM data goes via `--run-hook-payload` (16KB, delivered with microvmId to the `/run` hook) which is injection, not attestation. First-party page exists on MicroVMs as Claude Managed Agents sandbox. (docs.aws.amazon.com/lambda/latest/dg/microvms-launching.html, aws.amazon.com blog)

**Fly Machines:** OIDC automatic on all machines; `curl --unix-socket /.fly/api -X POST http://localhost/v1/tokens/oidc --data '{"aud":"..."}'`; issuer `https://oidc.fly.io/<org>`; claims incl. `app_id`, `app_name`, `machine_id`, `machine_name`, `org_id`, `region`, **`image`, `image_digest`**; sub = `org:app:machine-name`. Image-digest binding attests *what code* is running — richest claim set surveyed. (fly.io/docs/security/openid-connect/, fly.io/blog/oidc-cloud-roles/)

**Fly Sprites:** no documented workload identity; caller-side bearer tokens; egress via **Connectors** OAuth gateway (credential withholding). **Empirically confirmed by Jake inside a live sprite (2026-07-29): `/.fly/api` does not exist** — no `/.fly` directory, `find / -iname "*.fly*"` matches nothing, no `FLY_*` or `*OIDC*` env vars, no fly/oidc Unix sockets anywhere on the filesystem. So the Machines OIDC surface is stripped from Sprites entirely, not merely undocumented: Fly gives its platform-team machines a rich attested identity (down to image_digest) and gives its agent sandboxes none. That asymmetry is a deliberate withholding-side choice and an original, citable finding for the post. (sprites.dev/api, docs.sprites.dev)

**Daytona:** API keys caller-side only. **Secrets**: env var inside is a placeholder `dtn_secret_<random>`; outbound proxy substitutes real value into HTTPS headers only for allowed hosts; responses echoing the real value are scrubbed back to placeholder. (daytona.io/docs/en/secrets/)

**Modal:** `MODAL_IDENTITY_TOKEN` OIDC; issuer `https://oidc.modal.com`; fixed aud `oidc.modal.com`; sub `modal:workspace_id:<id>:environment_name:<n>:app_name:<n>:function_name:<n>:container_id:<id>` + individual claims; documented federation to AWS/Vault/GCP/Azure; **opt-in and disabled by default for modal.Sandbox**. (modal.com/docs/guide/oidc-integration)

**E2B:** "secure access" tokens protect SDK↔sandbox-controller traffic only; secrets in as env vars. (e2b.dev/docs/sandbox/secured-access)

**Cloudflare:** April 2026 blog explicit: "no token is ever granted to an untrusted user for any amount of time"; secrets live in the Worker; outbound-Worker proxy injects headers; `ctx.containerId` conditionalizes policy Worker-side but is not a signed artifact. Clearest articulation of the deliberate anti-attestation position — the foil for the post. (blog.cloudflare.com/sandbox-auth/)

**Prior art:** GitHub Actions OIDC is the claims-shape template everyone copied (sub `repo:org/repo:environment:prod`, runner-provided request URL/token, `permissions: id-token: write`). SPIFFE/SPIRE actively discussed for agent identity in 2026 (Stacklok, HashiCorp) but no sandbox platform ships it natively; critics note SPIRE registration fits poorly with sub-second sandbox creation. Ecosystem line worth using: **"identity is derived from attestation, not distributed as a secret."** (github docs OIDC hardening; stacklok.com blog; hashicorp.com blog; arXiv 2603.24775)

---

## Post-shaping notes

- Bridges three prior posts: new-kind-of-computer (the machine), secrets-have-names (the teased next step), how-i-use-infisical (K8s auth = the same pattern for cluster apps). Remember: link each post at most once.
- The "machines that belong to users" section of new-kind-of-computer is the setup: per-sandbox, user-owned identity, minted at session start, revocable one sandbox at a time. Infisical ABAC + OIDC claim mapping delivers exactly that shape where the platform attests; AWS delivers it only at role granularity.
- Honest tension to keep: half the industry (Cloudflare, Daytona) argues the sandbox should never be trusted with a secret at all, attested or not, because the code inside is unreviewed — which is new-kind-of-computer's own fourth property. Infisical's Agent Vault concedes this. Possible post title territory: the two answers to "how does a machine nobody reviewed get secrets" — prove yourself, or never hold them.
- Suspend/resume × token TTLs is the novel, unwritten-about intersection.
- Verify currency at draft time: Lambda MicroVMs GA date, Modal Sandbox opt-in flag, Infisical ABAC claim-mapping scope. (Sprites OIDC socket: DONE — empirically absent, see Fly Sprites section.)
