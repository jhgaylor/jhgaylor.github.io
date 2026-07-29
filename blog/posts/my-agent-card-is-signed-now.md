---
layout: layouts/blog.html
tags: ["posts"]
eleventyExcludeFromCollections: true
title: "My agent card is signed now"
og_image: /images/og/my-agent-card-is-signed-now.jpg
description: "The A2A agent card at ai.jakegaylor.com carries a JWS signature — any cached or redistributed copy is now verifiable instead of trusted on faith"
permalink: /blog/posts/my-agent-card-is-signed-now/
date: 2026-07-31
---

The agent card at [ai.jakegaylor.com](https://ai.jakegaylor.com/.well-known/agent-card.json) now carries a cryptographic signature. An ES256 JWS over the canonicalized card, verifiable against the public key served at [`/.well-known/jwks.json`](https://ai.jakegaylor.com/.well-known/jwks.json). The A2A spec calls this card signing; it shipped in 1.0 and the SDK does most of the work.

The subtle part is what the signature is for, because it isn't the live fetch. When an agent pulls the card straight from my domain, TLS already proves who served it — a signature adds nothing to that transaction. The signature earns its keep when the card is at rest somewhere else. Cards get cached. They'll get indexed by agent directories when those exist, stored in recruiter platforms' databases, passed from one agent to another. I already redistribute mine: [jakegaylor.com](https://jakegaylor.com/.well-known/agent-card.json) serves a static mirror so agents that check the canonical domain find their way to the endpoint, and until this week that mirror was an unsigned copy asking to be taken on faith. Now every copy is self-verifying wherever it was found, and a card that's been tampered with fails the check — I tested that specifically.

There's a quieter benefit too: key continuity. The signature says "the holder of this key published this card," and the same key signing next year's card is a stronger identity thread over time than DNS records that could change hands. The root of trust is still domain ownership — anyone can sign their own card claiming anything — but the signature hardens distribution and gives the identity a history.

Honest ecosystem report, same as the last two posts: nothing verifies signatures today. The official inspector doesn't check them, and the population of third-party agents that have fetched my card at all remains zero. Signing changed the behavior of nobody who visits. It's positioning — when agent directories emerge they'll want provenance for the cards they index, and a card signed from day one has a continuity story that a card signed later can't backfill. The whole afternoon cost a keypair, a JWKS route, and one hook in the request handler.

Verify it yourself: fetch the card, fetch the JWKS, and check the signature — the [A2A JS SDK](https://github.com/a2aproject/a2a-js) exports `verifyAgentCardSignature`. Or ask your agent to.
