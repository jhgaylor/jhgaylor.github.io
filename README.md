# jhgaylor.github.io

## About this site

This is Jake Gaylor's personal portfolio site — a static site built with [Eleventy](https://www.11ty.dev/) and deployed via GitHub Pages.

### Site sections

- **`index.html`** — Home page and landing experience
- **`bio/`** — Personal background and biography
- **`blog/`** — Writing and blog posts
- **`projects.html`** — Portfolio of projects Jake has worked on
- **`resume.html`** — Résumé generated from `resume.json`
- **`venn.html`** — Interactive Venn diagram visualization

---

## Local development

### Run the site locally

Starts an Eleventy dev server with live reload:

```
npx @11ty/eleventy --serve
```

### Rebuild the résumé

1. Update `resume.json` as needed.
2. Run `npm run build-resume`
3. Git commit all the changes to both files.
