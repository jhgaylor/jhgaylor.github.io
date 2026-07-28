---
layout: layouts/blog.html
tags: ["posts"]
title: "My website is an agent now"
og_image: /images/og/my-website-is-an-agent-now.jpg
description: "ai.jakegaylor.com speaks A2A 1.0 — a recruiter's agent can now discover my agent, interview it about my experience, and email me, with no human configuring anything"
permalink: /blog/posts/my-website-is-an-agent-now/
date: 2026-07-29
---

The [Agent2Agent protocol](https://a2a-protocol.org/) hit 1.0 under the Linux Foundation back in March, and the official JS SDK's stable 1.0 landed this month. As of this week, [ai.jakegaylor.com](https://ai.jakegaylor.com) implements it. One unauthenticated GET to [`/.well-known/agent-card.json`](https://ai.jakegaylor.com/.well-known/agent-card.json) returns a card describing an agent that represents me, and a JSON-RPC endpoint behind it will answer questions about my experience, explain how to connect to my MCP server, or deliver a message to my inbox.

That site has been accumulating interfaces for a while. The webpage is my resume addressed to humans. [`/llms.txt`](https://ai.jakegaylor.com/llms.txt) is the same resume addressed to language models that happen to crawl by. The MCP endpoint is the same resume addressed to an AI client that a human has configured. A2A is the fourth layer, and it's the first one where no human configures anything. An agent that lands on my domain can discover the card, read what my agent can do, and start a conversation, end to end, with nobody in the loop.

The build was small. The official [JS SDK](https://github.com/a2aproject/a2a-js) went stable six days before I started, and it mounts onto the Express app that already serves everything else. My executor is three skills. Questions get answered by a cheap model, gpt-5.4-nano, grounded in the resume and bio with instructions to refuse anything it can't source from them, and every answer costs a fraction of a cent. Messages mentioning MCP get onboarding instructions for the richer interface. Messages starting with `CONTACT:` get relayed to my email, and only that explicit prefix triggers mail, because an endpoint that strangers' agents can talk to should not be able to spend my outbound reputation by accident. If the model call fails, the skill falls back to returning the full resume, which is what it did deterministically before the LLM existed. The contract holds either way.

One lesson from the first hour in production: the spec may be 1.0, but the ecosystem isn't. The official A2A Inspector still runs a 0.3-era SDK, and the protocol treats clients that send no version header as 0.3 by definition. If I had shipped a pure 1.0 endpoint, every existing client would have bounced off it. The SDK's compat layer fixes this with one flag, and my card now advertises both versions on the same URL. If you're standing up an A2A server this month, enable it, or nothing currently deployed can talk to you.

The implication I actually care about is the hiring flow. Sourcing tools are already agents; the awkward part of the pipeline is that everything they read was written for humans. A card at a well-known URL flips that. When recruiter-side agents start crawling for them, the first screen stops being a human skimming a PDF and becomes their agent interviewing mine, asking pointed questions about Kubernetes or agent orchestration and getting grounded answers back at three in the morning. The people who are addressable that way get evaluated first. It's the same bet `llms.txt` was two years ago, an afternoon of work wagered on where the consumers of your professional identity are moving, except this time the consumer can ask follow-up questions.

Point any A2A client at `https://ai.jakegaylor.com` and ask it something. If it's worth a conversation, start your message with `CONTACT:` and my agent will make sure it finds me.
