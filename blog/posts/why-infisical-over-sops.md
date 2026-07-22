---
layout: layouts/blog.html
tags: ["posts"]
title: "My AI agents changed what I need from a secret store"
description: "Infisical > SOPS now that agents write my code"
permalink: /blog/posts/why-infisical-over-sops/
date: 2026-07-22
---

For a long time I used SOPS, and for a long time SOPS was the right call.

If you weren't in a major cloud, the story for dealing with secrets sucked. AWS and GCP folks got a managed secrets service with IAM bolted on. The rest of us got three options. You could wire a password manager CLI into your deploy scripts and hope everyone on the project had the same setup. You could bite the bullet and install Vault, which is a great product and also a whole second job. Or you could encrypt your secrets and store them right in the repo.

I picked the third one. SOPS encrypted my YAML, Flux decrypted it at apply time, and the whole thing genuinely worked. This summer I ripped it all out and moved everything to Infisical. This post is about why. If you want the tour of what the replacement actually looks like, that's over in [how I use Infisical in my home cloud](/blog/posts/how-i-use-infisical/).

## What SOPS life looked like

My cluster is a few Mac minis running k3s, with Flux reconciling everything from a git repo. Under SOPS, secrets were just part of that repo. Every one was an encrypted file sitting next to the manifests that used it, and Flux decrypted at apply time, which meant a decryption block in every single Kustomization. All 26 of them. And one age key, hand-carried between machines, could decrypt everything I own.

Here's what rotating one secret actually involved.

![The SOPS rotation lifecycle. You pull the repo, decrypt and edit the file with the age key, then re-encrypt and push. Flux decrypts it with the cluster age key, applies the Secret, and restarts the pods.](/images/sops-secret-lifecycle.svg)

Three of those five steps are me. And notice the age key shows up twice, once on my laptop and once in the cluster.

## The friction that added up

None of my complaints about SOPS are dealbreakers on their own.

Rotation was a chore, so I rotated less than I should have. Every new app meant another encrypted file, another decryption block, and another chance to fat-finger the recipient list. Secrets were scattered across the repo instead of living in one place I could look at and audit. And the age key bugged me a little more every year. It never rotated, it had to exist in two places, and it would decrypt everything forever.

Any one of those is livable. All of them together meant I dreaded touching secrets, and dreading rotation is how secrets end up three years old.

## Then the agents showed up

The thing that actually pushed me over the edge wasn't any of that. It was that the way I build software changed. AI agents work in my repos every day now, and agents change what a secret store needs to be.

An agent should never read a secret. It doesn't need the value. It needs a handle, a well-known name that every agent and every human can use to talk about the same thing. It needs to see what secrets exist without seeing what's inside them. And it needs to write the wiring that lets other systems consume a secret, again without the value ever appearing anywhere.

To be fair, SOPS handles more of this than you'd guess. It encrypts the values and leaves the structure readable, so an agent can look at an encrypted file and see the key names without decrypting anything. Discovery was possible, it just wasn't natural. The names were scattered across encrypted files in whatever directory used them, with no single place to list them. And everything past discovery ran through decryption. Editing a value meant decrypting the whole file, and the age key sat right on my laptop, so an agent doing routine work was always one command away from plaintext it didn't need. The moment it decrypts, that plaintext is in its context window and its transcripts. Nothing about the design pushed toward names instead of values.

There's a second agent problem, and it's about leaking. Secrets get leaked all the time, by humans and agents alike. Pretending otherwise is how you end up with a system that handles leaks badly. What you actually want is recovery so cheap that reporting a leak is a reflex. Under SOPS the recovery path was everything in that diagram up there, and nobody does that as a reflex.

## What I wanted instead

So the shopping list came out longer than the one I would have written a few years ago.

- Rotate a secret without a git commit
- Per-app scoping, so one leaked credential exposes one app instead of all of them
- No long-lived credentials sitting in the cluster or in my shell history
- A real story for rebuilding the cluster from nothing
- Plain Kubernetes Secrets on the consuming side, so apps don't have to change at all
- Secrets addressable by name, so agents and humans share a handle and nobody has to touch a value
- A way for an agent to list what secrets exist without reading any of them
- Rotation cheap enough that responding to a leak is boring

## Why Infisical won

There are other tools in this space that can do most of this. Infisical won for me because one product covered every box, and the pieces I cared most about came out of the box.

The secrets-operator turns a small CR into a plain Kubernetes Secret, so apps keep reading env vars and volume mounts like nothing happened. Kubernetes native auth means each app's identity is its ServiceAccount, validated by the cluster itself, so there are no stored credentials anywhere for any app. Every secret has a stable address, the project plus the secret name plus the key, and that address is what shows up in CRs, in diffs, and in conversations with agents, while the value stays in the store. And because Infisical also runs as a cloud service, the three bootstrap secrets that must exist before my self-hosted server does live in a tiny cloud project, while everything else stays in my house. The [how post](/blog/posts/how-i-use-infisical/) walks through that two tier design in detail.

Here's the same rotation from the SOPS diagram, today.

![The Infisical rotation lifecycle. You paste the new value into the Infisical UI, then the operator pulls it with k8s native auth, updates the Secret, and restarts the workload.](/images/infisical-secret-lifecycle.svg)

One step is me, and the machinery behind it is specific and boring. The operator polls the server every 60 seconds, rewrites the Kubernetes Secret when a value changes, and restarts the workloads that read it.

I want to be honest about the scope here. Out of the box, minting the new credential at the provider is still my job. What SOPS could never skip is the ceremony in the middle, because with SOPS the git commit is the transport.

The paste is only the default, though. Infisical has an API, and so do a lot of the providers that issue these credentials. When both ends have one, minting can be programmatic too. Something mints a new credential at the provider, writes it to Infisical, lets the propagation machinery roll it out, and revokes the old one. Not every secret supports this, and some take a lot more wiring than others. But for the ones that do, the whole loop closes without me.

So leak response has tiers now. The worst case is one paste. The best case is an agent that catches a token in a log and triggers the rotation itself, and the leak is fixed before I've read the alert. When rotation is painful, the developer who leaked a secret feels the pull to keep quiet and hope. When rotation is cheap, there's no shame to manage. You just rotate.

## What I gave up

This wasn't free, and I'd rather tell you the costs than pretend there aren't any.

SOPS plus git was fully offline. My cold bootstrap now needs the internet and Infisical Cloud to be up. A running cluster doesn't care, since the materialized Secrets persist and only rotation pauses. But a rebuild during an outage is a real regression and I'm choosing to accept it.

I also now run a stateful service whose availability gates secret rotation. The secret store has a database, the database has volumes, and those volumes are my problem.

And Kubernetes native auth binds every app identity to *this* cluster, so a full rebuild means re-pointing all of them at the new cluster's CA.

Oh, and migrations leave scars. Weeks after the cutover I found a comment in my monitoring config still confidently describing a SOPS-encrypted file that no longer exists. Rest in peace, little comment. 🪦

## Should you switch

If you're happy with SOPS, genuinely, stay. Offline bootstrap and zero moving parts are real features, and a small cluster that rarely rotates secrets may never feel the friction I did.

But if rotation has become the chore you keep putting off, or you're tired of one key that decrypts everything you own, or agents are writing code in your repos and you'd rather hand them names than values, a hosted secret store with an operator changes the daily experience completely.

For me the test is simple. I used to dread rotations and now I don't.
