---
layout: layouts/blog.html
tags: ["posts"]
title: "Your agents pay the tool tax every day"
description: "A workforce with no memory can't amortize a bad tool, so fit matters more than it ever did"
permalink: /blog/posts/agents-pay-the-tool-tax/
date: 2026-07-25
---

Tools aren't neutral. Every tool makes some moves cheap and others expensive, and you end up solving problems out of the cheap column. If deploys are scary, you batch changes. If provisioning a database takes a ticket and a week, you cram the new feature into the schema you already have. Nobody decides any of this in a meeting. The tool decides, and the team learns to call it engineering judgment.

That's been tolerable forever, because humans are phenomenal at absorbing tool misfit. Agents are not, and that changes which tools are good enough.

## Humans amortize. Agents can't.

A badly fitting tool rarely gets replaced. It gets survived. You learn the eleven-step workaround once and it becomes muscle memory. The new hire picks it up in a hallway. After a year nobody experiences the friction at all, because everyone's hands do the workaround without routing it through their brain. The misfit never went away. It just stopped generating complaints.

Amortization is the whole trick, and it requires memory. Pay the learning cost once, spread it over years of not noticing.

My workforce now includes agents, and agents have horrible memories. Every session is day one. Nothing settles into muscle memory because there is no muscle and no memory. Whatever it costs to fight the tool, an agent pays full price, every session, forever.

There are only two ways to cover that bill, and both are bad. You can write the workaround down, which works — [what isn't written down doesn't exist](/blog/posts/agent-ready-infrastructure/) — but notice what you're actually doing. Every gotcha in the runbook is a patch over a tool that fights you, the file grows with the misfit, and every agent spends context reading it before it can safely act. Or you can skip the doc and let each agent rediscover the workaround live, slightly differently every time. Now the risky procedure has five ad-hoc variants, invented by workers who will never compare notes.

There's a third option the first two hide: change the tool so the workaround doesn't exist. Deleting a runbook entry beats writing one.

## The grain cuts deeper now

There's a second effect stacked on the first. Agents follow a tool's grain harder than people do. A human will occasionally fight the tool out of taste, or stubbornness, or because they remember a better way from a previous job. An agent takes the cheap path almost every time, and then generalizes from it, because precedent is how agents work.

So the tool's opinion no longer just influences your solutions. It becomes them, repeated at machine speed by a workforce that never pushes back on the defaults. If the grain runs the wrong direction, you don't get occasional drift. You get a system that is confidently, consistently wrong in the exact shape of the tool's bad defaults.

That's the sharpened version of an old truth. Tools always shaped how teams solve problems. With agents, the shaping is total.

## I've already replaced one

This isn't hypothetical for me. SOPS managed the secrets in my [home cloud](/homelab/) for years, and for a workforce of one human it was fine. I knew the choreography, my hands did the decryption dance without complaint, and the friction had long since gone invisible.

Then agents joined the workforce and every hidden cost got itemized. Every secret operation routed through decryption on my laptop. Discovery meant opening encrypted files. There was no way for an agent to work near secrets without values bleeding into its context. No runbook fixes that, because the misfit was structural. So I [moved to a store where secrets have stable names](/blog/posts/why-infisical-over-sops/), and now [agents write all the wiring and never see a value](/blog/posts/secrets-have-names/).

The tool wasn't broken. The workforce changed underneath it, and the fit broke. I'd have kept SOPS for another decade if the only operator were me.

## What fit looks like for a forgetful workforce

When I evaluate a tool now, I ask how it treats a competent operator who has never seen it before and never will remember it. Day one, every day.

**The right way is the cheap way.** An agent takes the default path, so the default path has to be the safe one. A tool whose safe usage requires discipline is a tool designed for a workforce I don't have.

**Everything has a name.** Plans, diffs, and runbooks are made of nouns. If the tool's objects have stable addresses, agents can discuss them, reference them, and wire them without touching them. If the objects only exist as state in an operator's head, agents can't work there.

**The tool holds the state.** "Ask the tool" has to beat "remember from last time," because there is no last time. Anything the operator is supposed to just know is a fact the tool failed to keep.

**The errors do the teaching.** An error message is the only documentation guaranteed to arrive at the exact moment it's needed, in the context window of whoever hit the problem. A tool that fails with a good next step onboards my workforce every single session.

**Running it twice is harmless.** Agents retry a lot. Idempotent entry points turn retries from a hazard into a non-event.

None of this is an exotic wishlist. It's what good tools always looked like. The difference is that a human workforce lets you get away with tools that fail the list, and an agent workforce doesn't.

## Read the bill

The friction your team stopped noticing never stopped costing. You've been fluent in your tools so long you can't feel the grammar. Agents feel it, every session, and unlike your team they hand you an itemized bill: the scar-tissue docs, the re-derived workarounds, the context spent relearning what nobody can retain.

Read the bill. When the same line item keeps showing up, stop paying it. The workforce you're about to have doesn't need you to write better workarounds. It needs tools that don't require any.
