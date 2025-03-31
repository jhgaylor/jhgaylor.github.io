import { feedPlugin } from "@11ty/eleventy-plugin-rss";

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
    // Copy assets to their respective directories
    eleventyConfig.addPassthroughCopy({ "_assets/css": "css" });
    eleventyConfig.addPassthroughCopy({ "_assets/images": "images" });
    eleventyConfig.addPassthroughCopy({ "_assets/js": "js" });

    eleventyConfig.addPassthroughCopy({ "_assets/*.pdf": "." });

    eleventyConfig.addPassthroughCopy({ "_assets/*.txt": "." });

    eleventyConfig.addPassthroughCopy({ "_assets/CNAME": "./CNAME" });

    withRSS(eleventyConfig);

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes"
        }
    };
};