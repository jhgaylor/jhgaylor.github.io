// Generate per-post OG card images (1200x630) for every published post.
// Renders an HTML card per post and screenshots it with headless Chrome,
// matching the look of the site-wide og-card. Run from the repo root:
//
//   npm run build:og
//
// Cards land in _assets/images/og/<slug>.jpg. Each post opts in with:
//
//   og_image: /images/og/<slug>.jpg
//
// The script regenerates every card (idempotent) and lists posts whose
// frontmatter still needs the og_image line.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ogGradient, ogTints } from "../styles/brand.mjs";

const REPO = process.cwd();
const OUT = join(REPO, "_assets/images/og");
const WORK = join(tmpdir(), "og-cards");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HEADSHOT = `file://${REPO}/_assets/images/me_2025_2.png`;

mkdirSync(OUT, { recursive: true });
mkdirSync(WORK, { recursive: true });

const fm = (src, key) => {
  const m = src.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};

const posts = readdirSync(join(REPO, "blog/posts"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const src = readFileSync(join(REPO, "blog/posts", f), "utf8");
    return {
      file: f,
      excluded: /eleventyExcludeFromCollections:\s*true/.test(src),
      hasOgImage: /^og_image:/m.test(src),
      title: fm(src, "title"),
      description: fm(src, "description") || "",
      date: fm(src, "date"),
      slug: (fm(src, "permalink") || "").replace(/\/$/, "").split("/").pop(),
    };
  })
  .filter((p) => !p.excluded && p.slug);

// Role landing pages (see /kubernetes-engineer/ etc.) get a card each too,
// with the page's hero claim as the title. KEEP IN SYNC BY HAND: title should
// match the page's hero h1; editing a hero without updating this array ships
// a stale card. Slugs must match the page files (role-<slug> ↔ <slug>.html);
// each page opts in with  og_image: /images/og/role-<slug>.jpg
const rolePages = [
  {
    slug: "role-kubernetes-engineer",
    kicker: "HIRING A KUBERNETES ENGINEER?",
    title: "Teams on my clusters ship more and think about Kubernetes less.",
    description: "Production clusters from fleet in 2015 to the k3s cluster serving my house today.",
  },
  {
    slug: "role-aws-specialist",
    kicker: "HIRING AN AWS SPECIALIST?",
    title: "I build AWS infrastructure ahead of your scale and keep it boring.",
    description: "$10M+/yr of production AWS. HIPAA, PCI, SOC 2, and ISO 27001 on my watch.",
  },
  {
    slug: "role-platform-engineer",
    kicker: "HIRING A PLATFORM ENGINEER?",
    title: "I build paved roads and get every engineer on them.",
    description: "Org-wide adoption of a new deploy process in 3 days. A 30x faster GitOps pipeline.",
  },
  {
    slug: "role-devops",
    kicker: "HIRING A DEVOPS ENGINEER?",
    title: "Quarterly deploy events become shipping on demand.",
    description: "The same arc delivered at CyberGRX, Cloaked (30x faster), and Food Service Warehouse.",
  },
  {
    slug: "role-sre",
    kicker: "HIRING AN SRE?",
    title: "Product teams on my systems never ask whether the backend will hold.",
    description: "Petabyte scale kept boring, across thousands of Cassandra nodes.",
  },
  {
    slug: "role-ai-engineer",
    kicker: "HIRING AN AI ENGINEER?",
    title: "I ship agents with real access and no credentials to leak.",
    description: "Production agents at three companies, plus a coding-agent fleet I operate myself.",
  },
  {
    slug: "role-engineering-leader",
    kicker: "HIRING AN ENGINEERING LEADER?",
    title: "Teams I lead ship faster and can prove it.",
    description: "Led as a staff engineer, ran a $500K business with full P&L, raised a $400K pre-seed.",
  },
];

const titleSize = (t) => (t.length <= 35 ? 84 : t.length <= 55 ? 72 : t.length <= 75 ? 60 : 52);
const kickerDate = (d) =>
  new Date(`${d}T12:00:00Z`)
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
    .toUpperCase();

const html = (p) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; }
  body {
    font-family: -apple-system, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: ${ogGradient};
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 72px 80px 64px;
  }
  .kicker {
    font-size: 22px; font-weight: 600; letter-spacing: 4px; color: ${ogTints.kicker};
  }
  .title {
    font-size: ${titleSize(p.title)}px; font-weight: 700; line-height: 1.12;
    letter-spacing: -0.5px; text-wrap: balance; max-width: 1020px;
  }
  .desc {
    font-size: 28px; line-height: 1.45; color: ${ogTints.desc}; max-width: 900px;
    margin-top: 28px;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .byline { display: flex; align-items: center; gap: 20px; }
  .byline img {
    width: 68px; height: 68px; border-radius: 50%; object-fit: cover; object-position: 50% 35%;
    border: 2.5px solid rgba(255, 255, 255, 0.55);
  }
  .byline .name { font-size: 26px; font-weight: 600; }
  .byline .site { font-size: 26px; color: ${ogTints.site}; }
</style></head>
<body>
  <div class="kicker">${p.kicker || `BLOG&nbsp;&nbsp;·&nbsp;&nbsp;${kickerDate(p.date)}`}</div>
  <div>
    <div class="title">${p.title}</div>
    ${p.description ? `<div class="desc">${p.description}</div>` : ""}
  </div>
  <div class="byline">
    <img src="${HEADSHOT}">
    <span class="name">Jake Gaylor</span>
    <span class="site">jakegaylor.com</span>
  </div>
</body></html>`;

for (const p of [...posts, ...rolePages]) {
  const page = join(WORK, `${p.slug}.html`);
  const shot = join(WORK, `${p.slug}.png`);
  writeFileSync(page, html(p));
  execSync(
    `"${CHROME}" --headless --screenshot="${shot}" --window-size=1200,630 ` +
    `--force-device-scale-factor=2 --hide-scrollbars "file://${page}" 2>/dev/null`
  );
  // Downsample the 2x capture for crisp text, then convert to jpg for size.
  execSync(`sips -z 630 1200 -s format jpeg -s formatOptions 90 "${shot}" --out "${join(OUT, p.slug + ".jpg")}" >/dev/null`);
  console.log(`${p.slug}.jpg  <-  ${p.title}`);
}

rmSync(WORK, { recursive: true, force: true });

const missing = posts.filter((p) => !p.hasOgImage);
if (missing.length) {
  console.log("\nPosts missing the og_image frontmatter line:");
  for (const p of missing) console.log(`  ${p.file}: add  og_image: /images/og/${p.slug}.jpg`);
}
