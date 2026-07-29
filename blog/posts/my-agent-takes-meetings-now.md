---
layout: layouts/blog.html
tags: ["posts"]
title: "My agent takes meetings now"
og_image: /images/og/my-agent-takes-meetings-now.jpg
description: "The A2A agent at ai.jakegaylor.com went from answering questions to booking real calendar time — self-hosted Cal.com, explicit booking protocol, and every booking pending my approval"
permalink: /blog/posts/my-agent-takes-meetings-now/
date: 2026-07-30
---

[Yesterday's post](/blog/posts/my-website-is-an-agent-now/) ended with an agent that answers questions. As of last night it transacts. An agent that discovers [ai.jakegaylor.com](https://ai.jakegaylor.com) can ask for my availability, get live slots from my real calendar, and book a thirty-minute intro call. The booking lands as pending, I approve or decline it, and the booker gets the outcome by email.

The protocol has two halves, and the split is the design. Asking about scheduling is read-only: the agent gets two weeks of open slots as JSON plus the booking format. Creating the booking requires a message that starts with `BOOK:` — the same rule as `CONTACT:` from yesterday. Side effects never fire on inference; a stray sentence that happens to mention my calendar can't produce one. On top of that, bookings are capped per day and every one requires my confirmation before it becomes real, so the worst a misbehaving agent can do is fill a small queue I triage over coffee.

The backend is Cal.com, self-hosted on [the k3s cluster in my house](https://jakegaylor.com/homelab/). Two wrinkles for anyone repeating this. The obvious Docker tags are amd64-only and my nodes are Apple Silicon; the official arm64 builds exist, hiding under a `-arm` tag suffix. And API keys turned out to be an enterprise feature — the REST API they'd authenticate isn't even in the self-host image. Which turned out not to matter: the booking page itself runs on public, unauthenticated endpoints — a slots query and a booking POST — and my agent speaks those directly. It's a public booker, same as any human on the page, which is exactly what a recruiter's agent is.

That closes the loop I actually care about. Discover the card, interview my agent about my experience, pull my screening data as JSON, submit a job description for a fit assessment, book time on my calendar, or email me — end to end with nobody on my side until a real meeting shows up for my approval. Nothing is crawling for agent cards yet; that part of the bet hasn't changed since yesterday. What changed is the payoff shape. The old bets ended with an agent reading a page about me. This one ends with a calendar event.

Ask your agent when I'm free.
