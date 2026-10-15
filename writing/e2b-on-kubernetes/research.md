# Research: E2B's API on Kubernetes, with Firecracker underneath

Gathered 2026-10-14 for the loam launch post. Every claim about someone else's project has a source. Claims about loam come from its repo docs (ARCHITECTURE.md, E2B.md, STORE.md, PLAN.md and the phase test write-ups) and get re-checked against the public repo at publish time.

## Who has written about E2B on Kubernetes

Nobody I could find walks through running E2B's own stack on Kubernetes.

- E2B's open-source infra (e2b-dev/infra, Apache-2.0) deploys with Terraform onto Nomad and Consul. GCP is the supported path and AWS is beta. https://raw.githubusercontent.com/e2b-dev/infra/main/self-host.md
- A self-hosting guide puts the minimum GCP footprint near $1,250/month at list price (the author's own derivation). https://www.agenticwire.news/article/e2b-self-hosted-guide
- bex.co's "Firecracker Is the Easy 5%" (2026-09-13) argues the control plane is the real work (scheduler, template builds, snapshot store, networking, envd upgrades) and mentions kubernetes-sigs/agent-sandbox as the Kubernetes option. Kubernetes appears there as a translation you'd do yourself. https://bex.co/blog/2026/09/13/e2b-self-hosted-agent-sandbox-beyond-firecracker
- E2BGateway (DEV Community post, July 2026) is a Helm-installed Go gateway that points the E2B SDK at other backends, including kubernetes-sigs/agent-sandbox. Firecracker and gVisor adapters are on its roadmap. https://dev.to/dongjiang/why-i-built-e2bgateway-solving-ai-agent-sandbox-vendor-lock-in-51k6
- scitix/agent-sandbox is a Kubernetes operator with an E2B-compatible server over warm pod pools. Sandboxes are pods, and "microVM-backed sandboxes" is listed as coming soon. v0.0.13, Apache-2.0. https://pkg.go.dev/github.com/scitix/agent-sandbox
- Comparison roundups (HelixML, Beam, Northflank) cover self-hosted E2B alternatives without a Kubernetes plus microVM option. https://helix.ml/blog/self-hosted-agent-sandboxes https://www.beam.cloud/blog/how-to-self-host-code-sandbox https://northflank.com/blog/self-hostable-alternatives-to-e2b-for-ai-agents

## loam numbers used in the post (re-verify before publishing)

- Phase 1, one node, XFS reflinks. Pause 320 ms, resume from pause 29 ms, memory checkpoint 369 ms, fork 28 ms.
- Phase 2, cross node, 2 GiB base template. Wake on the other node with lazy memory 0.42 s. Diff pause after a move uploads 2 MB versus 16 MB the first time. Drain of a node with two awake sandboxes 13 s. Wake after a lost node 5.8 s.
- Official E2B Python and JS SDKs, 13 steps each, 26 of 26 pass, unmodified, against both local docker and production.
- Snapshot store is about 12k lines copied and trimmed from e2b-dev/infra under Apache-2.0. Importing it instead pulled 810 to 1006 packages, a 75 MB binary, cgo, and E2B's Firecracker fork.
- Firecracker upstream v1.17.0. Dirty pages from `track_dirty_pages` and diff snapshots.
- Lazy restore bug. Reading 256 MiB after a lazy restore put 292 MiB in the next diff, because pages installed through userfaultfd are writable and KVM logs them dirty on first read.
- About 55k lines of Go, 18.5k of them tests.

## Open questions for publish time

- Public repo URL and license (Apache-2.0 planned, NOTICE for the E2B-derived store).
- Is there a generic install path a stranger can follow? The post promises one.
- How to describe the build (three days, how much was agent-written). Reddit will ask.
