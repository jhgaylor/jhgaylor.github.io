---
layout: layouts/blog.html
tags: ["posts"]
title: "A lot more people are about to learn about micro vms"
permalink: /blog/posts/chaos-ape-claude/
date: 2025-04-06
---

Developers are used to pulling down and executing strange code on their workstations. I'm not saying it's great but npx / uvx are so popular because they allow you to execute named code from the web. Heck, even the installation instructions for uv boil down to `curl | bash`, or "run some code from the web".

However, businesses are not used to running untrusted code in their cloud environment. Most businesses treat their internal systems as single tenant even if they have multiple teams contributing code. As all these MCP servers become available teams will want to use them to add functionality to their LLM enabled applications.

There are two main ways to work with an mcp server. Either you spawn the mcp server locally or you connect to an existing instance of the mcp server. For businesses that choose to run the mcp servers themselves they will need to establish a trusted pipeline with the providers or ensure they sandbox them away from the rest of their software. Those that provide the cloud hosted MCP server instances will need to be good at sandboxing to achieve sane unit economics.

There are several of these micro vm hypervisors now with AWS's Firecracker being the biggest name and Cloud Hypervisor another contender.

A lot of people are familiar with Kubernetes and Docker and with Kata Containers we can achieve VM level isolation while continuing to use these tools.

I predict that we're about to see an explosion of growth in the number of businesses wanting to offer a whole catalogue of third party MCP servers and if we don't get ahead of the security concern we're going to be in trouble.

![Diagram showing MCP servers running in micro VMs](/images/mcp-micro-vms.png)
