import { readFileSync } from "node:fs";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

// "YYYY-MM" → absolute month count. The /resume/ page renders straight from
// resume.json, so durations are computed at build time (no client JS and no
// timezone math — the old theme's epoch diff rendered 24 months as "1 yr 11 mos").
const toMonths = (ym) => {
    const [year, month] = ym.split("-").map(Number);
    return year * 12 + (month - 1);
};

function withRSS(eleventyConfig) {
    eleventyConfig.addPlugin(feedPlugin, {
		type: "atom",
		outputPath: "/feed.xml",
		collection: {
			name: "posts", // iterate over `collections.posts`
			limit: 0,     // 0 means no limit
		},
		metadata: {
			language: "en",
			title: "Jake Gaylor",
			subtitle: "My thoughts, on paper.",
			base: "https://jakegaylor.com/",
			author: {
				name: "Jake Gaylor",
				email: "jhgaylor@gmail.com",
			}
		}
	});
}

export default function(eleventyConfig) {
    // Claude Code session files; skill markdown contains Liquid-like syntax that breaks the build.
    eleventyConfig.ignores.add(".claude/**");

    // Working notes behind the posts (research, outlines, drafts). Committed
    // for durability, never built — see writing/README.md.
    eleventyConfig.ignores.add("writing/**");

    // Repo docs, not site pages. Without these, Eleventy publishes them at
    // /README/ and /CLAUDE/ (README was live at jakegaylor.com/README/ until 2026-07-29).
    eleventyConfig.ignores.add("README.md");
    eleventyConfig.ignores.add("CLAUDE.md");

    // /resume/ renders from the same resume.json the rest of the tooling consumes.
    eleventyConfig.addGlobalData("resume", () => JSON.parse(readFileSync("./resume.json", "utf8")));

    // schema.org Person JSON-LD for the <head> of every page, computed from
    // resume.json so it can't drift. The classic-crawler counterpart to the
    // A2A agent card served at (ai.)jakegaylor.com/.well-known/agent-card.json.
    eleventyConfig.addGlobalData("personJsonLd", () => {
        const resume = JSON.parse(readFileSync("./resume.json", "utf8"));
        const b = resume.basics || {};
        return JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": "https://jakegaylor.com/#person",
            name: b.name,
            url: b.url || "https://jakegaylor.com",
            email: b.email ? `mailto:${b.email}` : undefined,
            jobTitle: b.label,
            address: b.location ? {
                "@type": "PostalAddress",
                addressLocality: b.location.city,
                addressCountry: b.location.countryCode,
            } : undefined,
            sameAs: [
                ...(b.profiles || []).map((p) => p.url),
                "https://ai.jakegaylor.com",
            ],
            knowsAbout: (resume.skills || []).map((s) => s.name),
        });
    });

    // "2022-06" → "Jun 2022"; empty/missing → "Present"
    eleventyConfig.addFilter("monthYear", (ym) => {
        if (!ym) return "Present";
        return new Date(`${ym}-15T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    });

    // Eleventy parses date-only front matter at UTC midnight. Format post dates
    // in UTC so a local timezone west of Greenwich does not show the prior day.
    eleventyConfig.addFilter("postDateISO", (value) => new Date(value).toISOString().slice(0, 10));
    eleventyConfig.addFilter("postDate", (value) => new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "2-digit",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(value)));

    // ("2020-06", "2022-06") → "2 yrs"; open-ended ranges run to today
    eleventyConfig.addFilter("duration", (start, end) => {
        if (!start) return "";
        const now = new Date();
        const endMonths = end ? toMonths(end) : now.getUTCFullYear() * 12 + now.getUTCMonth();
        const total = endMonths - toMonths(start);
        const years = Math.floor(total / 12);
        const months = total % 12;
        const parts = [];
        if (years) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
        if (months) parts.push(`${months} mo${months === 1 ? "" : "s"}`);
        return parts.join(" ") || "1 mo";
    });

    // Copy assets to their respective directories
    eleventyConfig.addPassthroughCopy({ "_assets/css": "css" });
    eleventyConfig.addPassthroughCopy({ "_assets/images": "images" });
    eleventyConfig.addPassthroughCopy({ "_assets/js": "js" });

    eleventyConfig.addPassthroughCopy({ "_assets/*.pdf": "." });

    eleventyConfig.addPassthroughCopy({ "_assets/*.txt": "." });

    eleventyConfig.addPassthroughCopy({ "_assets/CNAME": "./CNAME" });

    // A2A discovery from the root domain. Static snapshot of the card served
    // live at ai.jakegaylor.com/.well-known/agent-card.json — the interface
    // URLs inside point at ai.jakegaylor.com, so agents that check the
    // canonical domain first still find their way to the real endpoint.
    // Static means v1.0 shape only; version negotiation for legacy v0.3
    // clients happens at ai.jakegaylor.com. Refresh with:
    //   curl -s https://ai.jakegaylor.com/.well-known/agent-card.json \
    //     -H 'A2A-Version: 1.0' > _assets/well-known/agent-card.json
    eleventyConfig.addPassthroughCopy({ "_assets/well-known": ".well-known" });

    eleventyConfig.addPassthroughCopy({ "resume.json": "./resume.json" });

    eleventyConfig.addPassthroughCopy({ "admin": "admin" });

    eleventyConfig.addPairedShortcode("infobox", function(content) {
        return `<div class="info-box">${content}</div>`;
    });

    withRSS(eleventyConfig);

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes"
        }
    };
};
