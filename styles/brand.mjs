// Single source of truth for the brand palette. Bourbon copper, adopted
// 2026-08-14 (previously Tailwind blue + slate). Consumed by:
//   - tailwind.config.js  → the `brand-*` utility classes the templates use
//   - scripts/generate-og-cards.mjs and scripts/generate-home-og-card.mjs
// The favicon SVGs in _includes/layouts/home.html and main.html hardcode
// brand[700] — update them by hand when this palette changes, then rerun
// both OG scripts and `npm run build:css`.
export const brand = {
  50: "#fdf8f3",
  100: "#f9ede0",
  200: "#f2d9bd",
  300: "#e8bd92",
  400: "#dc9a62",
  500: "#cf7c3f",
  600: "#b45f27",
  700: "#96491e",
  800: "#7a3a1d",
  900: "#63301c",
  950: "#371a0f",
};

// OG-card gradient, the image-side twin of the hero band's
// from-brand-700 via-brand-800 to-brand-950.
export const ogGradient = `
      radial-gradient(90% 120% at 100% 0%, rgba(220, 154, 98, 0.30) 0%, rgba(220, 154, 98, 0) 55%),
      linear-gradient(120deg, ${brand[950]} 0%, ${brand[800]} 55%, ${brand[600]} 100%)`;

// Text tints on the dark gradient (kicker / body / site suffix on cards).
export const ogTints = { kicker: brand[300], desc: brand[100], site: brand[300] };
