# CLAUDE.md

Personal site for jakegaylor.com. Eleventy 3 builds to `_site/`, deployed via GitHub Pages. **This repo is public** — everything committed is world-readable, including working notes. Nothing private goes in this repo, ever.

## Writing blog posts

The thinking behind each post lives in `writing/<post-slug>/` (`research.md`, `outline.md`, `draft.md`) — conventions in `writing/README.md`. Start there from the first research step, not in scratch directories. When a post ships, the draft moves to `blog/posts/` and gains front matter (`layout: layouts/blog.html`, `tags: ["posts"]`, `title`, `description`, `og_image`, `permalink`, `date`); the research and outline stay behind as the record.

Voice rules, applied at draft time, not as a cleanup pass:

- No em-dashes anywhere in prose. No colons in body prose as rhetorical connectors (a colon introducing a literal list is fine; frontmatter is fine).
- No contrast-pair sentences ("It's not X. It's Y."), including in headers. No negation-reveal seesaws ("didn't come from X. It came from Y.").
- No bolded lead-sentence list items; write flowing paragraphs.
- No filler: no meta-commentary about the post itself, no throat-clearing transitions, no restating a point just made, no demonstrative-recap openers ("That's the bet.").
- Don't end sections on reinforcing aphorisms; end on a concrete claim or a directive.
- Link any given post at most once per article. Concrete numbers over adjectives.

After drafting, grep the file for `—` and `: ` and scan for the banned shapes before calling it done.

## Build

- `npx @11ty/eleventy` builds the site. `writing/**` and `.claude/**` are ignored by the build (see `.eleventy.js`).
- `npm run build:css` regenerates the pinned Tailwind build — required after adding Tailwind classes to any template. Whenever the build output changes, bump the `?v=` on the tailwind.css `<link>` in both layouts (`_includes/layouts/home.html` and `main.html`) or cached browsers render new markup with stale CSS.
- `npm run build:og` regenerates OG card images.
- `/resume/` renders from `resume.json` at build time. When `resume.json` changes, regenerate `_assets/JakeGaylor_resume.pdf` from the built page (print styles flatten the brand chrome).
