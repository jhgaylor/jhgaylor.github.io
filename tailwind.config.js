/** Static Tailwind build (replaces cdn.tailwindcss.com).
 * Scans every template that uses Tailwind classes; output goes to
 * _assets/css/tailwind.css via `npm run build:css`.
 */
export default {
  content: [
    "./index.html",
    "./projects.html",
    "./resume.html",
    "./_includes/**/*.html",
    "./blog/**/*.{html,md}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
