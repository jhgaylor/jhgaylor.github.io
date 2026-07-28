---
layout: layouts/blog.html
tags: ["posts"]
title: "We built a new kind of computer and called it a sandbox"
og_image: /images/og/new-kind-of-computer.jpg
description: "Fly, Vercel, Daytona, and AWS independently shipped the same agent-shaped primitive, and the operational discipline around it doesn't exist yet"
permalink: /blog/posts/new-kind-of-computer/
date: 2026-07-28
---

A new kind of computer showed up over the last couple of years, and we're calling the primitive an agent sandbox. It suspends when idle, wakes on demand, keeps its state, and answers to its own name. Fly sells one as Sprites, Vercel as Vercel Sandbox, Daytona as its sandboxes, and AWS as Lambda MicroVMs. This is a new class of software to operate. A lot of infrastructure people need to skill up on it, and the operational discipline for running it still has to be built.

## What you're actually operating

What happened is that the workload changed shape. For fifteen years the unit of cloud compute was the request, a few hundred milliseconds of stateless work for a human who is still watching the spinner, and we built our platforms, autoscalers, and pricing models around it. An agent moves into its computer. It installs tools, writes files, kicks off long jobs, sits parked while the model thinks or a person sleeps, and expects its half-finished work to be exactly where it left it when the next message lands.

Nobody gets just one, either. A person burns through dozens of agents in a working day, parks most of them mid-task, and reopens a conversation from three weeks ago expecting the terminal, the installed tools, and the working tree to be right where everything was left. Multiply that by a team and you're operating thousands of these computers, nearly all of them asleep at any given moment.

That computer is the primitive, a long-lived, mostly idle, stateful, individually addressable process running code nobody reviewed. Each of those properties changes how you operate it.

Its duty cycle is mostly idle. The machine sits parked while the model generates tokens, while a tool call runs somewhere else, and while the human wanders off for hours, so the economics of running it are suspension and oversubscription. That's why every platform leads with pause and resume. Google's experimental [Agent Substrate](https://github.com/agent-substrate/substrate) maps a large set of actors onto a small pool of ready workers, and its demo multiplexes about 250 stateful sessions across 8 pods. [KubeMicroVM](https://github.com/codriverlabs/KubeMicroVM), a Kubernetes operator that wraps Lambda MicroVMs in CRDs, takes the other route and pushes the parked time down to AWS with an idle timeout on the resource itself. Holding a full memory reservation around the clock is the cost structure this machine exists to escape.

Its state is the process itself. Terminal buffers, shell history, a half-written file the agent plans to come back to. None of that survives a kill and reschedule, so the lifecycle mechanism is checkpoint and restore of the live workload. Substrate drives runsc checkpoints under gVisor, and the microVM camp snapshots the whole machine. Nothing here is safely killable, because the instance is the data.

Each one is a named individual. You route to agent-session-1 and nothing else will do, which is why Substrate hands every actor its own hostname and KubeMicroVM's example resource carries a per-VM endpoint and a per-VM token. Fungibility is gone, and with it the whole mental stack of load balancers, replica counts, and Service selectors that don't care which copy answers.

And it runs code nobody reviewed. Namespaces and cgroups were never a security boundary, which stayed a tolerable fiction while everything in the cluster came through your CI, and it stops being tolerable when the process executes whatever the model just wrote. I made this argument about [MCP servers in April 2025](/blog/posts/micro-vms/), and agents settled it. A kernel boundary is mandatory here, and the choice between gVisor's userspace kernel and full hardware virtualization is where the platforms actually differ. Building the image yourself buys you nothing, since the interesting code arrives at runtime.

## The primitive shipped before the discipline

The public conversation about these products is cold start benchmarks and per-vCPU pricing tables, which makes sense if the CPU time is a commodity. But the vCPUs aren't all the same, because the platforms they run on aren't the same. The differences start where the comparison posts stop. We spent ten years building an operational discipline around the stateless container. Identity, egress, observability, capacity planning, cost attribution, blast radius. The categories all still apply, but the tooling under each one leans on a request boundary or a disposable instance somewhere, and this workload has neither.

Issuing machine credentials is not the hard part, the container era solved that for the workloads a platform team deploys. The new part is that users need them in bulk. A developer used to hold machine credentials for one laptop and that was the whole story. The same developer now parks dozens of sandboxes a week, each calling third party APIs on their behalf, each needing a credential that says what it is and who it acts for, minted at session start and revocable one sandbox at a time. A decade of identity tooling assumed machines belong to the platform, and these machines belong to users.

Few teams have a story for observability across a suspend boundary, and everyone operating these will need one. A session gets frozen for six hours, restored on a different host, and keeps going. Think about the trace that was open when it froze, the metrics that assume monotonic time, the log stream that now has a gap the length of a workday. Ten years of tooling assumes a process either runs or dies.

Capacity planning loses its instruments too. There's no request to count, so RPS and p99 mean nothing. Sprites' own pricing example is a four hour session that bursts to 8 CPUs and averages 30 percent of 2. That's a pricing example on the outside and a capacity planning nightmare on the inside.

And the ceilings sit lower than the pitch decks suggest. KubeMicroVM published its own load test, which found a hard account limit of roughly 161 concurrent running MicroVMs in us-east-1 and creation throughput of 3 to 4 VMs per second. The density story that motivates the whole category hit an account quota before it hit anything the operator controls.

## Where Kubernetes lands

Two answers exist in the wild. KubeMicroVM keeps Kubernetes as the control plane and outsources the compute to a managed AWS primitive, so it inherits AWS's ceiling, see the 161 VMs above. Substrate keeps Kubernetes underneath as the machine layer and takes it out of the critical path, running session scheduling through its own gRPC control plane, because going through kube-scheduler costs seconds and a human is waiting on the other end.

My money is on the second shape. The economics of this category are oversubscription, and you can't oversubscribe a primitive someone else meters per instance. Kubernetes gets demoted a layer rather than displaced, from the thing that schedules your workload to the thing that manages the machines your real scheduler packs sessions onto. VMs took the same demotion when containers arrived.

## What to go learn

Start with checkpoint and restore mechanics, [CRIU](https://criu.org) on plain Linux and [runsc checkpoints](https://gvisor.dev/docs/user_guide/checkpoint_restore/) under gVisor. The revealing part is what fails to survive a restore. Open TCP connections, GPU state, anything welded to host hardware. When a resumed session comes back subtly broken, that list tells you whether you're looking at a bug or at physics.

Then place [gVisor](https://gvisor.dev) and [Firecracker](https://firecracker-microvm.github.io) on the isolation and density curve. One intercepts syscalls with a userspace kernel and pays a compatibility tax, the other boots a real kernel in a hardware-isolated VM and pays in memory per guest. Every product in this category is a bet on one of those two points, and knowing which bet your vendor made tells you where it breaks.

Treat egress policy as a first-class config surface. When the workload is untrusted by construction, the domain allow list is where exfiltration defense lives, and [Sprites](https://sprites.dev) shipping one as a headline feature is the tell. Your NetworkPolicy instincts are correct, they just point at a new enforcement point now.

Understand snapshot boot, because it moved image build time. KubeMicroVM pays 2 to 4 minutes building an environment once, then launches clones from the snapshot. That kills cold starts and quietly breaks your patching story, since a snapshot is a frozen root filesystem that never picks up your base image rebuilds.

And learn workload identity for non-human callers. [SPIFFE](https://spiffe.io), token exchange, short-lived credentials injected across a trust boundary. It's the least mature of the five and it's where the open problem in this whole category lives.

## The convergence is the proof

If you're not convinced this is a primitive rather than a pile of products, here are four product descriptions with the vendor names removed.

* A persistent Linux computer that pauses when idle, checkpoints its whole filesystem in about 300ms, and wakes when a request hits its URL.
* An execution layer for agents where sandboxes persist by default and the filesystem snapshots itself.
* A sandbox that spins up in under 90 milliseconds, stays around indefinitely for persistent agents, and resumes any workflow from a saved snapshot.
* A managed microVM that suspends when idle and resumes with its RAM intact.

Can you tell which one is Sprites, which is Vercel Sandbox, which is Daytona, and which is Lambda MicroVMs? They're in that order. All four shipped within about eighteen months of each other, from teams that were not talking to each other, and the feature lists converged anyway. When that many vendors independently arrive at the same spec, it seems to me the spec is describing a primitive.

I was building Kubernetes clusters on vSphere with CoreOS and fleet in the summer of 2015, right as 1.0 shipped. The primitive worked then too. The discipline took another five years of postmortems. This new computer is at the same spot on that curve, and the fastest way to feel it is direct. Spin one up, suspend it mid-session, restore it, and count how many of your assumptions come back broken.
