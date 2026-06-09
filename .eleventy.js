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
    // /resume/ renders from the same resume.json the rest of the tooling consumes.
    eleventyConfig.addGlobalData("resume", () => JSON.parse(readFileSync("./resume.json", "utf8")));

    // "2022-06" → "Jun 2022"; empty/missing → "Present"
    eleventyConfig.addFilter("monthYear", (ym) => {
        if (!ym) return "Present";
        return new Date(`${ym}-15T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
    });

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

    eleventyConfig.addPassthroughCopy({ "resume.json": "./resume.json" });

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
