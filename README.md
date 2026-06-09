# jhgaylor.github.io

## About this site

This is Jake Gaylor's personal portfolio site — a static site built with [Eleventy](https://www.11ty.dev/) and deployed via GitHub Pages.

### Site sections

- **`index.html`** — Home page and landing experience
- **`blog/`** — Writing and blog posts
- **`projects.html`** — Portfolio of projects Jake has worked on
- **`resume.html`** — Résumé generated from `resume.json` (via `npm run build-resume`)
- **`bio/`**, **`old.html`**, **`interactive-resume.html`**, **`next.html`** — retired pages kept as redirect stubs so old links don't 404

---

## Local development

### Run the site locally

Starts an Eleventy dev server with live reload:

```
npx @11ty/eleventy --serve
```

### Rebuild the résumé

1. Update `resume.json` as needed.
2. Run `npm run build-resume` (renders the theme, then `scripts/postprocess-resume.mjs` injects the title, site nav, and analytics).
3. Regenerate `_assets/JakeGaylor_resume.pdf` from the rebuilt `/resume/` page so the download stays in sync.
4. Git commit all the changes.
