---
layout: layouts/blog.html
tags: ["posts", "interview-series"]
title: "Interview series: When should I use serverless? It isn't about cost."
permalink: /blog/posts/servers-vs-serverless/
date: 2025-03-30
---

{% infobox %}
In this series we are going to focus on questions that I regularly hear from interviewers. In most panel interviews we are trying to cover a lot of ground quickly and so these questions don't get the attention they deserve.
{% endinfobox %}

## Servers vs Serverless

This isn't quite the dichotomy it used to be. A whole spectrum of offerings are available now with managed autoscaling groups, tools like knative, and the big players make using them together as easy as they can. But the question boils down to explaining when to use a model where you pay per request and when to prefer a more traditional model where you lease systems by the hour. The big drivers there are

* Cost
* Architecture
* Developer Experience

Each are important to consider but there is a balance to strike. Bootstrapped projects might sacrifice everything for cost. A tools company might focus heavily on their own developer's experience. VC funded startups are often encouraged to under index on cost and without the wisdom to focus on developer experience they over index on architecture.

## Cost

For this one to ever ring up in the favor of servers, we have to assume a certain amount of traffic. If you've got a project that will sit idle most of the time and no business case to have it warmed up then this one is a pretty obvious win for the serverless category.

However, as you start to see regular traffic that demands scaling horizontally across multiple machines the costs start to even out. By the time we get here though our systems will be handling multiple requests per second. For many applications this breakeven point won't been seen until you have hundreds or thousands of daily active users but for those heavy with dynamic content it could show up sooner.

The closer your traffic is to being evenly distributed across the day and the more traffic you have, the less attractive serverless will look from a purely cost perspective.

With traditional servers, if we aren't staying at peak capacity we can over subscribe our nodes. This allows us to run multiple pieces of software on a single piece of hardware and allow the cost for each of those pieces to be shared.

## Architecture

Things start to get a little more interesting to my engineering brain here. Serverless systems are actually fairly different to traditional ones.

For request/response traffic, such as http, things are fairly similar and the biggest difference is the limited lifespan of the serverless process, which possibly terminates after every request. This paves over a lot of sins but it also means that we're having to pay setup costs regularly. If your application has a particularly expensive startup cost, it might not be well suited to serverless.

Serverless platforms are often built to respond to events. One variety here is an http request, but things get a little more nuanced when we look at processes that live for reasons other than serving http traffic. With software running on traditional servers, we have to manage subscriptions to an event publishers and monitor our consumers. With serverless we can connect a function as a sync for an event and the event management is handled by the platform. This can be connected with an event publishing database to create state machines.

Using serverless comes prepacked with a lot of opinions and will influence how you build your software.

## Developer Experience

For the humans doing the actual work, these systems have a world of differences. The way one thinks when working in each of these systems is fairly different and if they blindly treat lambda and ec2 as interchangable runtimes then everything will be needlessly complicated and the team will have a bad experience.

Shipping software to a serverless environment entails shipping small pieces of code, connecting them together using various other pieces of the platform, and this leads to having many fault points. These often involve a blackbox, but at least there is support.

In a more traditional environment a lot more of the decisions are in the hands of the team. Linux is Linux. The internet works the way it always has and they're free to rotate log files or stream stdout. They can use kubernetes or ansible and systemd. The slicing of the system is based on the social demands of the company and technological needs of the business. 

The important thing here is to consider the people you have and the skills you want to develop. If your team is appropriately skilled for the type of environment you have then the team will naturally produce tools that help them deliver value. The toil of their workflow will reduce, new team members will be able to onboard more quickly, the uptime of the system will improve, more time can be spent on innovation, and customers will be happier.
