// Post-processes the jsonresume-theme-even output (resume.html) after
// `npx jsonresume-theme-even < resume.json > resume.html`:
//   1. page title that carries the positioning
//   2. site nav (home / projects / PDF download), hidden in print
//   3. the same PostHog snippet the rest of the site uses
// Run via `npm run build-resume`.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../resume.html", import.meta.url);
let html = readFileSync(FILE, "utf8");

const TITLE = "<title>Jake Gaylor · Resume | Makes good teams ship like great ones</title>";

const HEAD_EXTRAS = `<style>.site-nav{grid-column:main;margin-top:1.5em;text-align:center}.site-nav a{white-space:nowrap}@media print{.site-nav{display:none}}</style>
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

const checks = [
  [/<title>[^<]*<\/title>/, TITLE],
  ["</head>", `${HEAD_EXTRAS}\n      </head>`],
  [/<body>/, `<body>\n        ${NAV}`],
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
