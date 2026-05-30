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

# Render the Site

npx @11ty/eleventy --serve 

# Render an updated resume.html from resume.json

Update `resume.json` as needed.

Run `npm run build-resume`

Git commit all the changes to both files