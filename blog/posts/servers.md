---
layout: layouts/blog.html
tags: ["posts", "interview-series"]
title: "Interview series: When should I use serverless? It isn't about cost."
permalink: /blog/posts/servers-vs-serverless/
date: 2025-03-29
eleventyExcludeFromCollections: true
---

In this series we are going to focus on questions that I regularly hear from interviewers. In most panel interviews we are trying to cover a lot of ground quickly and so these questions don't get the attention they deserve.

## Servers vs Serverless

This isn't quite the dichotomy it used to be. A whole spectrum of offerings are available now with managed autoscaling groups and tools like knative. But the question boils down to explaining when to use a model where you pay per request and when to prefer a more traditional model where you lease systems by the hour. The two most obvious drivers there are 

* Cost per request
* Architecture

But two that are more interesting to me are

* Developer Experience
* Total Cost of Ownership

## Cost per request

For this one to ever ring up in the favor of servers, we have to assume a certain amount of traffic. If you've got a project that will sit idle most of the time and no business case to have it warmed up then this one is a pretty obvious win for the serverless category.

However, as you start to see regular traffic that demands scaling horizontally across multiple machines the costs start to even out. By the time we get here though our systems will be handling multiple requests per second. For many applications this breakeven point won't been seen until you have hundreds or thousands of daily active users. 

The closer your traffic is to being evenly distributed across the day and the more traffic you have, the less attractive serverless will look from a purely cost perspective.

## Architecture

Things start to get a little more interesting to my engineering brain here. Serverless systems are actually fairly different to traditional ones.

For request/response traffic such as http things are fairly similar and the biggest difference is that serverless processes shutdown often. Sometimes their lifespan is only a single request. This paves over a lot of sins but it also means that we're having to pay setup costs regularly. If your application has a particularly expensive startup cost, it might not be well suited to serverless.

Serverless platforms are often built to respond to events. One variety here is an http request, but things get a little more nuanced when we look at processes that live for reasons other than serving http traffic. With software running on traditional servers, we have to manage subscriptions to an event publishers and monitor our consumers. With serverless we can connect a function as a sync for an event and the event management is handled by the platform. This can be connected with an event publishing database to create state machines.

[clear pro case for servers]

## Developer Experience



## Total Cost of Ownership
