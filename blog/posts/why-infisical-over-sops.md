---
layout: layouts/blog.html
tags: ["posts"]
title: "Why I chose Infisical over SOPS"
permalink: /blog/posts/why-infisical-over-sops/
date: 2026-07-22
---

For a long time I used SOPS, and for a long time SOPS was the right call.

If you weren't in a major cloud, the story for dealing with secrets sucked. AWS and GCP folks got a managed secrets service with IAM bolted on. The rest of us got three options. You could wire a password manager CLI into your deploy scripts and hope everyone on the project had the same setup. You could bite the bullet and install Vault, which is a great product and also a whole second job. Or you could encrypt your secrets and store them right in the repo.

I picked the third one. SOPS encrypted my YAML, Flux decrypted it at apply time, and the whole thing genuinely worked. This summer I ripped it all out and moved everything to Infisical. This post is about why. If you want the tour of what the replacement actually looks like, that's over in [how I use Infisical in my home cloud](/blog/posts/how-i-use-infisical/).

## What SOPS life looked like

My cluster is a few Mac minis running k3s, with Flux reconciling everything from a git repo. Under SOPS, secrets were just part of that repo. Every one was an encrypted file sitting next to the manifests that used it, and Flux decrypted at apply time, which meant a decryption block in every single Kustomization. All 26 of them. And one age key, hand-carried between machines, could decrypt everything I own.

Here's what rotating one secret actually involved.

![The SOPS rotation lifecycle. You pull the repo, decrypt and edit the file with the age key, re-encrypt and push, Flux decrypts it with the cluster age key and applies the Secret, then you restart the pods yourself.](/images/sops-secret-lifecycle.svg)

Four of those six steps are me. And notice the age key shows up twice, once on my laptop and once in the cluster.

## The friction that added up

None of my complaints about SOPS are dealbreakers on their own.

Rotation was a chore, so I rotated less than I should have. Every new app meant another encrypted file, another decryption block, and another chance to fat-finger the recipient list. Secrets were scattered across the repo instead of living in one place I could look at and audit. And the age key bugged me a little more every year. It never rotated, it had to exist in two places, and it would decrypt everything forever.

Any one of those is livable. All of them together meant I dreaded touching secrets, and dreading rotation is how secrets end up three years old.

## What I wanted instead

Before shopping for a replacement I wrote down what would actually make me happy.

- Rotate a secret without a git commit or a manual pod restart
- Per-app scoping, so one leaked credential exposes one app instead of all of them
- No long-lived credentials sitting in the cluster or in my shell history
- A real story for rebuilding the cluster from nothing
- Plain Kubernetes Secrets on the consuming side, so apps don't have to change at all

## Why Infisical won

There are other tools in this space that can do most of this. Infisical won for me because one product covered every box, and the pieces I cared most about came out of the box.

The secrets-operator turns a small CR into a plain Kubernetes Secret, so apps keep reading env vars and volume mounts like nothing happened. Kubernetes native auth means each app's identity is its ServiceAccount, validated by the cluster itself, so there are no stored credentials anywhere for any app. And because Infisical also runs as a cloud service, the three bootstrap secrets that must exist before my self-hosted server does live in a tiny cloud project, while everything else stays in my house. The [how post](/blog/posts/how-i-use-infisical/) walks through that two tier design in detail.

Here's the same rotation from the SOPS diagram, today.

![The Infisical rotation lifecycle. You paste the new value into the Infisical UI, the operator pulls it with k8s native auth, updates the Kubernetes Secret, and auto-reload restarts the workload.](/images/infisical-secret-lifecycle.svg)

One step is me. The rest is machinery.

## What I gave up

This wasn't free, and I'd rather tell you the costs than pretend there aren't any.

SOPS plus git was fully offline. My cold bootstrap now needs the internet and Infisical Cloud to be up. A running cluster doesn't care, since the materialized Secrets persist and only rotation pauses. But a rebuild during an outage is a real regression and I'm choosing to accept it.

I also now run a stateful service whose availability gates secret rotation. The secret store has a database, the database has volumes, and those volumes are my problem.

And Kubernetes native auth binds every app identity to *this* cluster, so a full rebuild means re-pointing all of them at the new cluster's CA.

Oh, and migrations leave scars. Weeks after the cutover I found a comment in my monitoring config still confidently describing a SOPS-encrypted file that no longer exists. Rest in peace, little comment. 🪦

## Should you switch

If you're happy with SOPS, genuinely, stay. Offline bootstrap and zero moving parts are real features, and a small cluster that rarely rotates secrets may never feel the friction I did.

But if rotation has become the chore you keep putting off, or you're tired of one key that decrypts everything you own, a hosted secret store with an operator changes the daily experience completely.

For me the test is simple. I used to dread rotations and now I don't.
