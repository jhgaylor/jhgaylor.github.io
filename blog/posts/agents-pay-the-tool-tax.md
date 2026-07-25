---
layout: layouts/blog.html
tags: ["posts"]
title: "Your agents pay the tool tax every day"
description: "A workforce with no memory can't amortize a bad tool, so fit matters more than it ever did"
permalink: /blog/posts/agents-pay-the-tool-tax/
date: 2026-07-25
---

Every tool makes some moves cheap and others expensive, and you end up solving problems out of the cheap column. If deploys are scary you batch changes. If provisioning a database takes a ticket and a week, the new feature gets crammed into the schema you already have. Nobody chooses any of that in a meeting, the tool chooses it, and the team learns to call the result engineering judgment.

None of this used to bother me much, because humans are good at absorbing a bad fit. Then my workforce filled up with agents, who absorb nothing.

## Surviving a bad tool takes memory

A badly fitting tool usually gets survived rather than replaced. You learn the eleven step workaround once and it settles into muscle memory. The new hire picks it up in a hallway. A year in, nobody experiences the friction anymore, since everyone's hands route around it without involving their brains. The misfit is still there, it just stopped generating complaints.

That trick is amortization, and it runs on memory. You pay the learning cost once and spread it over years of not noticing.

Agents have horrible memories. Every session is day one. Muscle memory never forms because there is no muscle and no memory to form it in. Whatever it costs to fight the tool, an agent pays full price every single session.

I know two ways to cover that bill and both are ugly. Writing the workaround down works, since [an agent only knows what's on disk](/blog/posts/agent-ready-infrastructure/), but look at what the runbook becomes. Every gotcha in it is a patch over a tool that fights you, the file grows in proportion to the misfit, and each agent burns context reading it before doing anything. Skipping the doc goes worse. Each agent rediscovers the workaround live, a little differently every time, until the risky procedure has five ad hoc variants invented by workers who will never compare notes.

The two ugly options hide a third one. Change the tool until the workaround has nothing left to work around. Deleting a runbook entry beats writing one.

## The grain cuts deeper now

Agents also follow a tool's grain harder than people do. A human will sometimes fight the tool out of taste, or stubbornness, or a better way remembered from an old job. An agent takes the cheap path nearly every time and then generalizes from it, since precedent is how agents work. Whatever direction the tool leans, the whole workforce leans with it, at machine speed, with nobody pushing back on the defaults. A tool with a bad grain used to cost you some drift around the edges. Now it hands you a system that is confidently and consistently wrong in the exact shape of its defaults.

## I've already replaced one

SOPS managed the secrets in my [home cloud](/homelab/) for years, and for a workforce of one human it was fine. I knew the choreography, my hands did the decryption dance without complaint, and the friction had long since gone invisible.

Then agents joined the workforce and every hidden cost got itemized. Every secret operation routed through decryption on my laptop. Discovery meant opening encrypted files. An agent couldn't work anywhere near secrets without values bleeding into its context. No runbook was going to fix that, because the misfit was structural, so I [moved to a store where secrets have stable names](/blog/posts/why-infisical-over-sops/) and now [agents write all the wiring without ever seeing a value](/blog/posts/secrets-have-names/).

Nothing about SOPS got worse in those years. The workforce changed underneath it, and if I were still the only operator I'd have happily kept it another decade.

## What fit looks like for a forgetful workforce

When I evaluate a tool now I ask how it treats a competent operator who has never seen it before and never will remember it. Day one, every day.

The default path has to be the safe path, because an agent takes the default. A tool whose safe usage depends on operator discipline was designed for a workforce I no longer have.

The tool's objects need names. Plans, diffs, and runbooks are made of nouns, and when things have stable addresses an agent can discuss them, reference them, and wire them up without ever touching them. Objects that live as state in an operator's head might as well not exist.

Asking the tool has to beat remembering, because there is no remembering. Anything the operator is supposed to just know is a fact the tool failed to keep.

Errors carry more weight than manuals. An error message is the only documentation guaranteed to arrive at the exact moment it matters, inside the context window of whoever hit the problem. A tool that fails with a good next step onboards my workforce fresh every session.

And running anything twice has to be harmless, since agents retry constantly.

There's nothing exotic on that list. Good tools always worked this way, a human workforce just let you get away with the ones that didn't.

## Read the bill

The friction your team stopped noticing never stopped costing you. You've been fluent in your tools for so long that the grammar disappeared. Agents feel every bump, and they leave the evidence where you can read it. Scar tissue piling up in the runbook. The same workaround re-derived in transcript after transcript. Context burned relearning what no worker can retain.

When the same line item keeps showing up, stop writing better workarounds and go get the tool that fits the workforce you actually have.
