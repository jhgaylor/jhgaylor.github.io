---
layout: layouts/blog.html
tags: ["posts"]
title: "E2B's API on Kubernetes, with Firecracker underneath"
description: "loam runs each sandbox as a Firecracker microVM on a warm worker pod, sleeps idle ones as snapshots in object storage, and speaks E2B's API so the official SDKs work unchanged"
og_image: /images/og/e2b-on-kubernetes.jpg
permalink: /blog/posts/e2b-on-kubernetes/
date: 2026-10-15
---

Last year I wrote that [a lot more people were about to learn about micro VMs](/blog/posts/micro-vms/). I'm one of them now. My agents write and run code all day, and I wanted that code inside Firecracker on the three machines in my house, speaking E2B's API, because that's the API the agent tooling already speaks.

So I went looking for someone who had put E2B on Kubernetes. I couldn't find anyone. E2B's own [infra repo](https://github.com/e2b-dev/infra) is open source and good, and it deploys with Terraform onto Nomad and Consul in GCP, with AWS in beta. The Kubernetes projects that speak E2B, like [scitix/agent-sandbox](https://github.com/scitix/agent-sandbox) and [E2BGateway](https://github.com/e2bgateway/e2bgateway), run each sandbox as a pod. I wanted a VM boundary around code nobody reviewed, and I wanted it on the cluster I already run.

So I built it. It's called loam, it's open source under Apache-2.0 as of today at [github.com/arugula-salad/loam](https://github.com/arugula-salad/loam), and the project site with the docs is [loam.agentsh.it](https://loam.agentsh.it).

## A sandbox is a row in Postgres

The first design decision did most of the work. A loam sandbox is a record in Postgres, and it only becomes a running thing while it's awake. Each KVM node runs one long-lived pod called a nodelet, from a DaemonSet. The nodelet boots Firecracker microVMs inside its own pod, owns their network, and pauses them to object storage when they go idle. The default is to pause after five minutes without activity.

Nothing about waking a sandbox touches the Kubernetes scheduler or etcd. Pod startup on my cluster is measured in seconds. Resuming a paused sandbox on the node that has its snapshot takes 29 ms. Waking it on a different node, with memory paged in lazily from object storage, takes 0.42 s. A paused sandbox costs its diff in S3 and nothing else, so the machines only hold the handful that are doing something.

Kubernetes still does what it's good at. It runs the API server, keeps a nodelet on every labelled node, hands out `/dev/kvm` through a device plugin, and drains a node when I reboot it. On a drain the nodelet pauses every VM and uploads it inside the termination grace period, and the sandboxes wake somewhere else on their next request with their processes intact. Draining a node with two awake sandboxes takes 13 seconds. When a node dies outright, its paused sandboxes wake elsewhere in about 6.

## The E2B part

loam has its own API and CLI, and an adapter that speaks E2B's. Set `E2B_DOMAIN` and an `E2B_API_KEY` from loam, and the official Python and JavaScript SDKs work without a code change. The adapter runs E2B's own envd inside the guest, so the data plane (commands, files, streaming, signed file URLs) is their code, and loam handles create, kill, timeouts, pause, resume and auto-resume, network rules, metrics and listing. Our test drives both SDKs through 13 steps each, and all 26 pass against production.

Plenty is missing. There's no template build API, no E2B snapshot or fork endpoints, no volumes, no logs endpoint, and egress rules are hostnames only, with no CIDRs. The [E2B doc in the repo](https://github.com/arugula-salad/loam/blob/main/docs/E2B.md) lists every gap. If your agents create a sandbox, run code, move files and kill it, loam covers that today.

## I copied E2B's snapshot store

The hard part of sandboxes that sleep is the snapshot format. A paused VM is a memory file and a disk, both large, both mostly unchanged since the last pause. E2B solved this well. Each layer stores only dirty blocks, packed into independently compressed 2 MiB zstd frames, with one flattened header per generation so a resume costs one GET on any node.

My first attempt imported their package. That pulled in about a thousand Go packages, a 75 MB binary, cgo, their feature flag client, and their fork of Firecracker. So I copied about 12,000 lines under their Apache-2.0 license, kept the format, credited every file, and pointed it at upstream Firecracker 1.17 with dirty page tracking turned on. Memory restores lazily through a userfaultfd handler that runs as its own process, because running it inside the Go process deadlocks the garbage collector.

## Things that bit me

Lazy restore makes everything you read look written. Pages installed through userfaultfd come in writable, so KVM logs them dirty the first time the guest reads them. Reading 256 MiB after a lazy restore put 292 MiB in the next diff. The fix compares each dirty page against the parent's chunks and uploads only the ones that really changed. After a move, a pause now uploads 2 MB where the first one uploaded 16.

The default seccomp profile blocks `userfaultfd(2)`, and no capability gets you past it. The nodelet asks for `/dev/userfaultfd` through the device plugin instead, the same way it asks for `/dev/kvm` and `/dev/net/tun`, so it runs unprivileged with a short list of added capabilities.

A sandbox that moved nodes lost its network for 30 seconds. Every node's bridge had a random MAC address, and the guest's ARP cache still pointed at the old one. The bridge has the same fixed MAC everywhere now.

Headless Chrome couldn't reach anything through the egress filter. Chrome sends Encrypted Client Hello as GREASE on every connection, and the filter refused ECH. It judges by the outer SNI now.

Memory checkpoints left exec sessions hanging forever, because Firecracker resets the guest's vsock on save and doesn't tell the host.

## The network is the boundary

Everything loam enforces, it enforces in the nodelet, outside the guest. A sandbox reaches the internet and nothing else, so the node, the pod network and my LAN are all dropped. Egress rules allow names, and a DNS forwarder plus a transparent proxy that checks Host and SNI make sure a sandbox can't reach a different site sharing an allowed site's CDN address.

Secrets get brokered. The sandbox's environment holds a placeholder, and the nodelet swaps in the real value on the wire for the hosts that secret is allowed to reach. The real value never lands in the guest's env, disk or memory snapshot, which counts for a lot when snapshots sit in object storage for weeks. Each sandbox can also ask for a short-lived OIDC token naming itself, which is the [first credential I've been writing about](/blog/posts/first-credential-cant-be-a-secret/). All of it survives pause, wake, moves and forks.

## Running it

You need x86 nodes with KVM (bare metal, or a cloud instance with nested virtualization), Linux 6.1 or newer, a device plugin for kvm, tun and userfaultfd, an XFS directory with reflinks for the node cache, an S3-compatible bucket and Postgres. I use Garage for the bucket and CloudNativePG for Postgres. The repo has a kustomize base and an example overlay you copy and fill in, and `docs/INSTALL.md` walks through it from the device plugin to your first E2B call.

It's young. The first commit was on October 11, the API server runs as one replica, and VMs share their nodelet's cgroup instead of getting their own. It has run everything I used to run on my old single-host Firecracker setup since then, including 17 browser games, a CI runner and an E2B endpoint my friends use. Most of the code was written by Claude Code, with me setting the design and reviewing the work, and I run my own workloads on it every day. If you try it, I'd love to hear what breaks.
