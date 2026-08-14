/** Static Tailwind build (replaces cdn.tailwindcss.com).
 * Scans every template that uses Tailwind classes; output goes to
 * _assets/css/tailwind.css via `npm run build:css`.
 */
import { brand } from "./styles/brand.mjs";

export default {
  content: [
    "./index.html",
    "./projects.html",
    "./homelab.html",
    "./resume.html",
    "./kubernetes-engineer.html",
    "./aws-specialist.html",
    "./platform-engineer.html",
    "./devops.html",
    "./sre.html",
    "./ai-engineer.html",
    "./engineering-leader.html",
    "./_includes/**/*.html",
    "./blog/**/*.{html,md}",
  ],
  theme: {
    extend: {
      colors: { brand },
    },
  },
  plugins: [],
};
