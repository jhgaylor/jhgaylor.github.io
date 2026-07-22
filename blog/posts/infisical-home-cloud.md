---
layout: layouts/blog.html
tags: ["posts"]
title: "The umpteen jobs Infisical does in my home cloud"
permalink: /blog/posts/infisical-home-cloud/
date: 2026-07-22
---

My homelab is a k3s cluster spread across a few Mac minis — Linux VMs via Lima, Tailscale for the network, Flux reconciling everything from a git repo. That architecture is a post for another day. This post is about secrets, because I recently ripped SOPS out of that repo, replaced it with Infisical, and Infisical ended up doing way more jobs than I planned to give it.

I count at least eleven. Let's go.

## Life under SOPS

For a long time every secret in my cluster lived in git as an age-encrypted YAML file. Flux decrypted them at apply time, which meant a decryption block in every single Kustomization — all 26 of them. Rotating a secret meant re-encrypting a file and pushing a commit. And the age key was the crown jewel: one file, hand-carried between machines, that decrypted everything I own.

It worked. It was fine. But every new app meant another encrypted file, another decryption block, another chance to fat-finger the recipient list. And "one key decrypts everything forever" started feeling less like a design and more like a confession.

## The design: two Infisicals

The replacement is two tiers.

**On-prem Infisical**, self-hosted in the cluster, is the source of truth for runtime app secrets. Every app gets its own project and its own machine identity. If an app reads an API key at runtime, it comes from here.

**Cloud Infisical** holds exactly three things, in a project I call the bootstrap kernel: the Cloudflare token cert-manager needs for DNS-01, the Tailscale OAuth client, and the on-prem server's own environment.

Why the split? Because the on-prem server's database lives on storage *inside the cluster it serves*. On a full rebuild, nothing can come from on-prem — it doesn't exist yet. The things that must exist before the secret store exists have to live somewhere else.

**Warning:** the tempting move is to also put your on-prem admin credentials in cloud so a rebuild is fully hands-off. Don't. If cloud gets compromised, the attacker now reads runtime secrets from your publicly reachable on-prem instance. My cloud tier can bootstrap the platform; it cannot read a single app secret.

## Job #1: Infisical bootstraps Infisical

Here's my favorite part. The on-prem server needs an `ENCRYPTION_KEY` and `AUTH_SECRET` in its environment before it can start. A server can't fetch its own encryption key from itself.

So the on-prem server's env is delivered by a *cloud-backed* InfisicalSecret. Infisical delivering Infisical's secrets to Infisical. The operator pulls them from cloud, materializes a plain Kubernetes Secret, and the server boots off it like any other app.

**Hack:** export the `ENCRYPTION_KEY` to your password manager anyway. A wrong encryption key doesn't error politely — it makes the server unable to read its own data. Ask me how I know to be careful here.

## Job #2: runtime secrets with zero stored credentials

This is the job that sold me. Every app's machine identity uses Kubernetes-native auth: the operator presents the app's ServiceAccount token, and the Infisical server validates it against the cluster's TokenReview API.

There is no clientId. There is no clientSecret. For any app. Anywhere. Nothing to leak, nothing to rotate, nothing to accidentally commit. Each identity is pinned to exactly one ServiceAccount in one namespace, with viewer access to one project.

The apps themselves have no idea Infisical exists. The operator turns each InfisicalSecret CR into a boring native Kubernetes Secret, and pods consume it with `envFrom` or a volume mount like it's 2016. The CR is all of this:

```yaml
apiVersion: secrets.infisical.com/v1alpha1
kind: InfisicalSecret
spec:
  authentication:
    kubernetesAuth:
      identityId: <the app's identity>
      serviceAccountRef:
        name: myapp-infisical
        namespace: myapp
  managedKubeSecretReferences:
    - secretName: myapp-secrets
      secretNamespace: myapp
```

## Job #3: the whole system reduces to one secret

Under SOPS my secret zero was an age key that decrypted everything. Now it's a single cloud machine identity with viewer access to three bootstrap secrets. That's the entire blast radius of the one credential I still hand-carry.

It gets seeded by a one-shot Ansible playbook that reads the credential from environment variables — not `-e` flags, because your shell history is not a secret store — and writes it into the cluster as the one Secret the operator uses for cloud pulls.

One credential, scoped to almost nothing, replaceable in five minutes. That's a trade I'll take over the god-key every time.

## Jobs #4 through #11: everything else it quietly does

This is where "umpteen" earns the title. Once the pattern existed, everything migrated into it:

- Flux's GitHub webhook token, so pushes trigger reconciles instantly
- Alertmanager's ntfy token, so my phone buzzes when something breaks
- cert-manager's Cloudflare token and the Tailscale operator's OAuth client (cloud tier)
- oauth2-proxy's session secrets, my S3-compatible storage keys, an OpenAI API key, auth for half a dozen app repos that ride the same per-app pattern

And a couple of design details doing quiet work:

- The operator talks to the server over internal cluster DNS — no Traefik, no Cloudflare, no TLS handshake for an in-cluster reconcile.
- Apps that read secrets as env vars get an auto-reload annotation, so a rotation restarts them automatically. Apps that mount secrets as files, or re-read them per request, deliberately don't — kubelet and the app handle it. Knowing *how* each workload reads its secrets is the whole game.

My favorite data point: one of my apps has no runtime secrets at all, so it has no Infisical dependency at all. The pattern costs nothing when you don't need it.

## The scars

Nobody blogs the error messages, so here are mine.

**The Kubernetes auth host must be the full FQDN** — `https://kubernetes.default.svc.cluster.local`. The server's resolver doesn't apply the cluster DNS search domain, so the short name you'd naturally type fails with `ENOTFOUND` and no further explanation.

**The server will refuse to call the cluster API at all** until you set `ALLOW_INTERNAL_IP_CONNECTIONS=true`. That's its SSRF guard doing its job, but the failure looks like broken auth, not a guard.

**Orphaned Secrets stay dead.** I use `creationPolicy: Orphan` so the operator would overwrite my old SOPS-managed Secrets in place during cutover instead of fighting them. The price: if a managed Secret gets deleted out from under the operator — say, by a Flux prune — the operator's cache still says "synced" and it never recreates it. The fix is restarting the operator. Learned that one in production, if a homelab has production.

**`prune: false` on the secret store itself.** The server's database sits on volumes with a delete reclaim policy. One careless Flux restructure could cascade-delete the Kustomization, the PVCs, and every secret I own. The GitOps machinery does not get to garbage-collect the secret store.

## The honest trade-offs

SOPS plus git was fully offline. My cold bootstrap now needs the internet and Infisical Cloud to be up. A *running* cluster doesn't care — the materialized Secrets persist and only rotation pauses — but rebuild-during-an-outage is a real regression and I'm choosing to accept it.

I also now run a stateful service whose availability gates secret rotation. And Kubernetes auth binds every identity to *this* cluster, so a full rebuild means re-pointing all of them at the new cluster's CA.

Oh, and migrations leave scars: there's still a comment in my monitoring config confidently describing a SOPS-encrypted file that no longer exists. I'm leaving it there as a monument. 🪦

## Should you do this?

If you're happy with SOPS, genuinely, stay. Offline bootstrap and zero moving parts are real features.

But if you've caught yourself dreading a rotation, or your age key is starting to feel like a confession, the shape that worked for me is: put the bootstrap kernel somewhere that survives your cluster, put everything else on-prem behind Kubernetes-native auth, and get to a place where exactly one credential exists outside the system — scoped so tightly that losing it costs you almost nothing.

Umpteen jobs. Two tiers. One secret.
