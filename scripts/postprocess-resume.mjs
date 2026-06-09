// Post-processes the jsonresume-theme-even output (resume.html) after
// `npx jsonresume-theme-even < resume.json > resume.html`:
//   1. page title that carries the positioning
//   2. site nav (home / projects / PDF download), hidden in print
//   3. the same PostHog snippet the rest of the site uses
//   4. canonical + favicon + Open Graph tags so /resume/ unfurls when shared
//   5. month-based duration math (the theme's epoch diff reads local-time
//      components off a UTC date, so 24 months renders as "1 yr 11 mos")
// Run via `npm run build-resume`.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../resume.html", import.meta.url);
let html = readFileSync(FILE, "utf8");

const TITLE = "<title>Jake Gaylor · Resume | Makes good teams ship like great ones</title>";

const OG_DESCRIPTION = "I make good teams ship like great ones. 15+ years across SaaS, AI, infrastructure, and IoT. Resume for senior, staff, and engineering leadership roles.";

const HEAD_EXTRAS = `<link rel="canonical" href="https://jakegaylor.com/resume/" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='12' fill='%231d4ed8'/><text x='32' y='45' font-family='system-ui,sans-serif' font-size='32' font-weight='700' fill='%23ffffff' text-anchor='middle'>JG</text></svg>" />
        <meta property="og:type" content="profile" />
        <meta property="og:site_name" content="Jake Gaylor" />
        <meta property="og:url" content="https://jakegaylor.com/resume/" />
        <meta property="og:title" content="Jake Gaylor · Resume | Makes good teams ship like great ones" />
        <meta property="og:description" content="${OG_DESCRIPTION}" />
        <meta property="og:image" content="https://jakegaylor.com/images/og-card.jpg?v=3" />
        <meta property="og:image:alt" content="Jake Gaylor" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Jake Gaylor · Resume | Makes good teams ship like great ones" />
        <meta name="twitter:description" content="${OG_DESCRIPTION}" />
        <meta name="twitter:image" content="https://jakegaylor.com/images/og-card.jpg?v=3" />
        <style>.site-nav{grid-column:main;margin-top:1.5em;text-align:center}.site-nav a{white-space:nowrap}@media print{.site-nav{display:none}}</style>
        <script>
        !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
        posthog.init('phc_2eJY8Qs3B3H34qrYmBTK1d8GqN2xVsblmaTthTQujAB', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'always',
        })
        </script>`;

const NAV = `<nav class="site-nav">
          <a href="/" data-cta="resume-home">← jakegaylor.com</a> ·
          <a href="/projects/" data-cta="resume-projects">Projects</a> ·
          <a href="/JakeGaylor_resume.pdf" data-cta="resume-download-pdf">Download PDF</a>
        </nav>
        <script>
          document.addEventListener("click", function (ev) {
            var el = ev.target.closest("[data-cta]");
            if (el && typeof posthog !== "undefined") {
              posthog.capture("cta_click", { cta: el.getAttribute("data-cta") });
            }
          });
        </script>`;

// The theme's TimeDuration element diffs epoch millis and then reads
// getFullYear()/getMonth() (local time) off a UTC-parsed date, so any
// negative TZ offset knocks the result down a day — "Jun 2020 – Jun 2022"
// renders as "1 yr 11 mos". Dates in resume.json are month-precision
// ("YYYY-MM"), so compute whole months instead.
const DURATION_OLD = /const duration = dates\.split\('\|'\)\.reduce\(\(acc, _date, i, dates\) => \{[\s\S]*?const days = diffDate\.getDate\(\) - 1/;

const DURATION_NEW = `const toMonths = (value) => {
      const d = new Date(value)
      return d.getUTCFullYear() * 12 + d.getUTCMonth()
    }
    const totalMonths = dates.split('|').reduce((acc, _date, i, dates) => {
      if (i % 2) return acc
      const [startDate, endDate] = dates.slice(i)
      return acc + (startDate ? toMonths(endDate || Date.now()) - toMonths(startDate) : 0)
    }, 0)

    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12
    const days = 0`;

const checks = [
  [/<title>[^<]*<\/title>/, TITLE],
  ["</head>", `${HEAD_EXTRAS}\n      </head>`],
  [/<body>/, `<body>\n        ${NAV}`],
  [DURATION_OLD, DURATION_NEW],
];

for (const [needle, replacement] of checks) {
  const before = html;
  html = html.replace(needle, replacement);
  if (html === before) {
    console.error(`postprocess-resume: pattern not found: ${needle}`);
    process.exit(1);
  }
}

writeFileSync(FILE, html);
console.log("postprocess-resume: title, nav, and PostHog injected");
