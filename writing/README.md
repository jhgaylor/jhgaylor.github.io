# writing/

The thinking behind the posts. One folder per post slug, holding whatever the article needed on its way to `blog/posts/`: research with sources, outlines, drafts, decisions made and rejected, claims to re-verify before publishing.

None of this is built into the site. Eleventy ignores `writing/**` (see `.eleventy.js`), so nothing here gets a URL on jakegaylor.com.

**It is still public.** This repo is public on GitHub, so everything committed here is world-readable in source. That's the deal, working notes in the open, and it imposes one hard rule. Nothing private goes in this directory. No credentials, no personal context about other people, no claims about anyone's current role or status. If a note needs private context to make sense, the note stays out and the context lives elsewhere.

## Conventions

- Folder name matches the post's eventual slug (`writing/prove-yourself-or-hold-nothing/` for `/blog/posts/prove-yourself-or-hold-nothing/`).
- Typical files, use what the post needs: `research.md` (findings with a source URL for every claim), `outline.md` (structure, link budget, publish-time verification list), `draft.md` (until it graduates to `blog/posts/`).
- When a post ships, the draft moves to `blog/posts/` and gains front matter. The research and outline stay here as the record.
- Dead ideas keep their folders. A post that never shipped is still thinking worth keeping.
