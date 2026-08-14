# Outline v1: five first-boot bugs shipping a Node app into Kubernetes

Skeleton drafted 2026-08-14 from issue #14. Mid-size war-story listicle from containerizing behold and running it in-cluster (home-cloud PRs #61–#67). Standalone; no series dependencies, publishable any time.

**Thesis:** the distance between "runs in docker on my laptop" and "runs as a hardened pod" is five specific walls, and every one of them announces itself as a googleable error message. The post is organized so each section header or first line contains the literal error text, because the audience arrives from a search box.

**Form:** listicle, five numbered sections plus a bonus. Each section runs symptom (the exact error, verbatim, in a code block early), cause (why Kubernetes or the runtime behaves this way), fix (the exact change), and one lesson line. Flowing prose inside sections, no bolded lead sentences.

Working title: issue title "Five first-boot bugs shipping a Node app into Kubernetes" works; "first-boot" is the hook. Description candidate: "runAsNonRoot rejecting USER node, git dubious ownership in an emptyDir, OOMKilled at two different limits, a 401 with a valid token, and Flux health-checking the wrong revision. Five walls between docker-on-laptop and a healthy pod."

Intended front matter when it ships: layout `layouts/blog.html`, tags `["posts"]`, og_image and permalink to match final title, date TBD.

Link budget (each linked exactly once):

- behold repo (intro, the app being shipped)
- candidates: Kubernetes docs for runAsNonRoot semantics, git safe.directory docs, Flux health-check docs; SEO-serving external links are fine here, still one each

## 1. Intro (no header)

- Two or three sentences, no throat-clearing: behold ran fine in a container on the laptop; getting it to run as a properly hardened pod took five distinct fights, and every one ended in an error message worth writing down for the next person to search.

## 2. `runAsNonRoot` rejects `USER node`

- Symptom: pod refuses to start with the container-has-runAsNonRoot-and-image-has-non-numeric-user error (quote exactly).
- Cause: Kubernetes cannot verify a *named* user is non-root at admission; names resolve inside the image, and the kubelet won't trust that resolution.
- Fix: numeric `runAsUser: 1000` (or numeric USER in the Dockerfile). Lesson line: the securityContext speaks uid, not username.

## 3. git "dubious ownership" in an emptyDir

- Symptom: `fatal: detected dubious ownership in repository` from the in-pod git operations.
- Cause: emptyDir mounts root-owned, the app runs as uid 1000, and git's safe.directory check treats the mismatch as a hijack risk.
- Fix: ConfigMap-mounted `/etc/gitconfig` declaring `safe.directory`. Include the honest detour: the `GIT_CONFIG_*` env route worked but tripped an unrelated secrets lint (env keys that looked like credentials), so config-as-file won. Lesson line: system-level gitconfig is the container-friendly place for trust declarations.

## 4. OOMKilled at 1Gi and again at 3Gi

- Symptom: OOMKilled, limit raised, OOMKilled again. The guess-and-bump loop shown honestly.
- Cause: the app spawns 11 child processes and composes a 45,000-pixel SVG in heap; the working set is real, not a leak.
- Fix: measured, landed at 6Gi. Lesson line: measure the actual working set before choosing a limit; a limit chosen by vibes is just a scheduled restart. (Check the lesson line against the aphorism gate at draft time; keep it concrete.)

## 5. The 401 with a valid token

- Symptom: curl with the mounted SA token gets 200 from the API server; the app's Kubernetes client gets 401 "no credentials." The best mystery of the five, give it the most room.
- Cause: the client reads inline `token:` from kubeconfig but not `tokenFile:`, so the projected token never entered the request.
- Fix: legacy non-expiring service-account-token Secret inlined into the kubeconfig, the Headlamp pattern. Note the tradeoff honestly (a non-expiring token is a step down from projected tokens; scoped to what behold's read-only role allows).
- Lesson line: when curl says 200 and the client says 401, diff what each actually sent, not what the config says they should send.

## 6. Flux `wait: true` wedges on an unhealthy deploy

- Symptom: the fix for a crashloop can't land; reconciliation blocks for 9m30s health-checking the *old* revision before the new apply.
- Cause: `wait: true` makes the Kustomization gate on health that the incumbent revision can never reach, serializing recovery behind the failure.
- Fix and lesson: the pipe that ships fixes must not wait on the brokenness it exists to fix. This one earns a forward pointer: it is the failure-shape cousin of the drift-green-health-red thesis; link that post here if shipped, one sentence only.

## 7. Bonus: darwin node_modules in a linux container

- Short section: mounting the laptop's `node_modules` into the container fails on esbuild's native binaries (darwin binaries, linux runtime). Fix: `make install` in-container. Two or three sentences.

## 8. Closing

- Brief, resist the summary recap: one paragraph on the pattern across all five (each wall is Kubernetes declining to trust something the laptop trusted implicitly: a username, a mount's ownership, a memory guess, a kubeconfig field, a health signal). Ender: concrete directive. No aphorism.

## Source material to pull into research.md

- home-cloud PRs #61–#67 (apps/behold): exact error strings for every symptom, the ConfigMap gitconfig manifest, the final resource block, the kubeconfig Secret shape, the Flux Kustomization before/after
- Verify the numbers before publishing: 11 child processes, 45,000-pixel SVG, 6Gi, 9m30s, uid 1000
- Headlamp docs or issue where the inline-token pattern comes from (cite it, it's borrowed)

## Style gates before shipping

- Grep for em-dashes and body colons. Scan for contrast pairs, negation-reveal seesaws, recap openers, aphorism enders (lesson lines are the danger spots), bolded list leads (listicle sections must open with prose, not bolded symptoms).
- Each post, repo, and doc linked at most once. Error messages verbatim in code blocks so they index. No current-Ravi claims.
- Verify at publish time: error strings match what the PRs show, the drift-green-health-red link only if shipped, Headlamp pattern attribution correct.
