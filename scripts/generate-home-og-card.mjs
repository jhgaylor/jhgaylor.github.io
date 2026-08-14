// Regenerate the site-wide og-card (1200x630): left copy column, right photo
// panel, colors from styles/brand.mjs. Writes _assets/images/og-card.png
// (source) and og-card.jpg (served). Runs as part of `npm run build:og`.
// KEEP IN SYNC BY HAND: kicker/title/desc mirror the homepage hero copy.
// After the served jpg changes, bump the ?v= cache-buster in
// _includes/layouts/home.html and main.html.
import { writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { brand, ogGradient, ogTints } from "../styles/brand.mjs";

const REPO = process.cwd();
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HEADSHOT = `file://${REPO}/_assets/images/me_2025_2.png`;
const WORK = join(tmpdir(), "og-home");
mkdirSync(WORK, { recursive: true });

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: -apple-system, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: ${ogGradient};
    color: #fff;
    display: flex;
    align-items: center;
    gap: 56px;
    padding: 0 72px;
  }
  .copy { flex: 1; }
  .kicker {
    font-size: 22px; font-weight: 600; letter-spacing: 4px; color: ${ogTints.kicker};
    margin-bottom: 34px;
  }
  .title {
    font-size: 62px; font-weight: 700; line-height: 1.14;
    letter-spacing: -0.5px; text-wrap: balance; margin-bottom: 30px;
  }
  .title .lite { color: ${brand[200]}; }
  .desc {
    font-size: 26px; line-height: 1.45; color: ${ogTints.desc}; max-width: 640px;
    margin-bottom: 40px;
  }
  .byline { font-size: 24px; font-weight: 600; }
  .byline .site { color: ${ogTints.site}; font-weight: 400; }
  .photo {
    width: 310px; height: 410px; border-radius: 22px; object-fit: cover; object-position: 50% 30%;
    border: 3px solid rgba(255, 255, 255, 0.35); flex-shrink: 0;
    box-shadow: 0 24px 60px rgba(0,0,0,0.35);
  }
</style></head>
<body>
  <div class="copy">
    <div class="kicker">SENIOR &middot; STAFF &middot; ENGINEERING LEADERSHIP</div>
    <div class="title">I build systems <span class="lite">a stranger can run on day one.</span></div>
    <div class="desc">One reviewable path to production, the conventions written down, and a blast radius you can survive.</div>
    <div class="byline">Jake Gaylor <span class="site">&middot; jakegaylor.com</span></div>
  </div>
  <img class="photo" src="${HEADSHOT}">
</body></html>`;

const page = join(WORK, "og-card.html");
const shot = join(WORK, "og-card.png");
writeFileSync(page, html);
execSync(
  `"${CHROME}" --headless --screenshot="${shot}" --window-size=1200,630 ` +
  `--force-device-scale-factor=2 --hide-scrollbars "file://${page}" 2>/dev/null`
);
copyFileSync(shot, join(REPO, "_assets/images/og-card.png"));
execSync(`sips -z 630 1200 -s format jpeg -s formatOptions 90 "${shot}" --out "${join(REPO, "_assets/images/og-card.jpg")}" >/dev/null`);
console.log("og-card.jpg regenerated (remember the ?v= bump if it changed)");
