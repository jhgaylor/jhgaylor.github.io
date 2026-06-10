# jhgaylor.github.io

## About this site

This is Jake Gaylor's personal portfolio site — a static site built with [Eleventy](https://www.11ty.dev/) and deployed via GitHub Pages.

### Site sections

- **`index.html`** — Home page and landing experience
- **`blog/`** — Writing and blog posts
- **`projects.html`** — Portfolio of projects Jake has worked on
- **`resume.html`** — Résumé page template; renders from `resume.json` at build time
- **`bio/`**, **`old.html`**, **`interactive-resume.html`**, **`next.html`** — retired pages kept as redirect stubs so old links don't 404

---

## Local development

### Run the site locally

Starts an Eleventy dev server with live reload:

```
npx @11ty/eleventy --serve
```

### Rebuild the Tailwind CSS

Styles are a static Tailwind build (no CDN). After adding or changing Tailwind
classes in any template, regenerate `_assets/css/tailwind.css`:

```
npm run build:css
```

### Update the résumé

1. Update `resume.json` as needed — `/resume/` renders from it automatically
   (`resume.html` is an Eleventy template; data is wired up in `.eleventy.js`).
2. Regenerate `_assets/JakeGaylor_resume.pdf` from the rebuilt `/resume/` page so
   the download stays in sync. The page has print styles (the PDF is a subset:
   work + skills, no projects/references), so print-to-PDF the built page
   (letter, 0.4in margins, background graphics off).
3. Git commit all the changes.
