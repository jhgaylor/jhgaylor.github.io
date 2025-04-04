---
layout: layouts/blog.html
tags: ["posts", "shitposts", "prompts"]
title: "Revolutionize Your Job Search: An AI-Powered Pipeline for Non-Coders"
permalink: /blog/posts/claude-mcp-job-search/
date: 2025-04-03
---


Job hunting. It’s a necessary evil, right? I’ve spent countless hours scrolling through endless job boards, trying to decipher cryptic job descriptions, and mentally cataloging companies I might be interested in. It’s a frustrating, time-consuming process, especially when you feel like you’re just throwing your resume into the void. For me, the worst part was the initial discovery – finding those hidden gems, the companies that align with my skills and interests, but aren’t plastered all over the usual job sites. I knew there had to be a better way, a way to cut through the noise and find the opportunities that truly mattered. That's when I started exploring the power of Large Language Models (LLMs) and a tool I built using the Model Context Protocol (MCP).

Imagine having a personal job hunting assistant, one that could scour the internet, filter through thousands of job postings, and organize everything into a neat, personalized database. Sounds like science fiction? Not anymore. I’m here to show you how you can build your own AI-powered job search pipeline, even if you don’t know a line of code. This guide will walk you through the process, step by step, and empower you to take control of your career journey.

In this post, you’ll learn how to leverage the power of LLMs like Claude, along with MCP, to automate your job search. We’ll cover everything from setting up your tools to crafting effective prompts and managing your results. By the end, you'll have a streamlined system that saves you time, improves your job discovery, and keeps your search organized.

## Understanding the Tools

Let's start with the basics. LLMs, like Claude, are powerful AI models that can understand and generate human-like text. Think of them as super-smart assistants that can read, analyze, and summarize vast amounts of information. In our case, Claude will be our research partner, sifting through job postings and extracting the key details. You won’t need to train it or write any code to get it to do this. You simply give it instructions in plain english.   

Now, what’s MCP? It stands for Model Context Protocol, and it’s essentially the glue that connects our tools together. It allows LLMs to interact with different applications, like web browsers and databases, in a structured way, by providing context to the model. In our setup, MCP enables Claude to automatically search for jobs and input the data into your Notion database.   

For our job search, we’ll be using HireBase, a platform that aggregates job postings from various sources. This provides a rich database of opportunities for Claude to explore. Then, we’ll use Notion, a versatile workspace that allows us to create a customized database to track our job leads. Think of Notion as your digital job search command center. It's flexible, easy to use, and perfect for organizing all your job-related information.   

## Setting Up Your Pipeline

Setting up your AI-powered pipeline might sound intimidating, but I’ve broken it down into simple steps. First, you’ll need to install the necessary components. This includes setting up your environment for running MCP servers. You’ll be using a tool called Playwright, which allows Claude to interact with web pages. Don't worry, even if you're not tech savvy, these are all installable packages that require very little configuration.   

Next, you'll need to configure the Playwright and Notion MCP servers. This involves setting up the connection between Claude and these applications. Essentially, you will be telling Claude how to access the internet and your Notion database. You can find detailed instructions and configuration files on my GitHub repository: https://github.com/jhgaylor/hirebase-mcp.

Now, for the fun part: setting up the HireBase MCP server. This is the custom server I built to connect Claude to the HireBase job database. It allows Claude to query the database and retrieve relevant job postings based on your criteria. You will clone the repository, install the dependencies, and run the server.

Finally, you’ll create a personalized job search database in Notion. You can customize the schema to include fields like company name, job title, location, salary, and application status. This database will be your central hub for tracking your job applications. Once you have the servers running and the Notion database set up, you can verify that everything is working by running a simple test prompt. For example, you can ask Claude to find a few sample jobs and check if they appear in your Notion database.

## Using the System

The key to unlocking the power of this system is writing effective prompts. Think of prompts as instructions for Claude. The more specific and detailed your prompts are, the better the results will be. For example, instead of saying “find jobs,” you could say “Find software engineering jobs in San Francisco with a focus on AI, that would be a good fit for the candidate described by [your website link].”

Here’s an example of how the automation flow works: You write a prompt, Claude uses the HireBase MCP server to search for jobs, extracts the relevant information, and then uses the Notion MCP server to populate your database. The entire process is automated, saving you hours of manual searching and data entry.

You can customize your job search criteria by refining your prompts. You can specify location, industry, job title, required skills, and more. You can also customize your Notion database to include specific fields that are important to you. For example, you can add a “notes” field to track your thoughts on each job posting.

## Tips for Better Results

To get the most out of your AI-powered job search, it's essential to optimize your prompts. Be specific and detailed in your instructions. For example, include keywords related to your skills and experience. You can also experiment with different prompt variations to see what works best.

Customizing your Notion database schema can also improve your results. Add fields that are relevant to your job search, such as company culture, benefits, and growth opportunities. You can also use Notion’s filtering and sorting features to organize your job leads and prioritize your applications.   

Regularly maintain your pipeline by updating your prompts and refining your database schema. This will ensure that your job search remains efficient and effective. Also, remember to review the generated results and filter out any irrelevant jobs.

## Benefits and Impact

The most significant benefit of this system is the time savings. Instead of spending hours manually searching for jobs, you can automate the process and focus on other aspects of your job search, such as networking and preparing for interviews. This efficiency translates to more applications and a better chance of landing your dream job.

Furthermore, the quality of your job matches will improve. Claude can analyze job descriptions and identify opportunities that align with your skills and interests. This leads to a more targeted and effective job search.

Finally, this system democratizes access to advanced job search tools for non-technical users. You don’t need to be a coder or data scientist to leverage the power of AI. Anyone can build their own pipeline and take control of their career journey.

## Conclusion

The future of job searching is here, and it’s powered by AI. By leveraging LLMs and MCP, you can build a personalized job search pipeline that saves you time, improves your job discovery, and keeps your search organized. This system empowers you to take control of your career and find the opportunities that truly matter.

Ready to revolutionize your job search? Experiment with different prompts and customize your Notion database to fit your needs. And remember, the possibilities are endless.

## Resources for Getting Started:

GitHub Repository: https://github.com/jhgaylor/hirebase-mcp

HireBase: [Link to Hirebase]

Notion: [Link to Notion]

