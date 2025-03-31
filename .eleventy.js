export default function(eleventyConfig) {
    // Copy assets to their respective directories
    eleventyConfig.addPassthroughCopy({ "_assets/css": "css" });
    eleventyConfig.addPassthroughCopy({ "_assets/images": "images" });
    eleventyConfig.addPassthroughCopy({ "_assets/js": "js" });

    eleventyConfig.addPassthroughCopy({ "_assets/*.pdf": "." });

    eleventyConfig.addPassthroughCopy({ "_assets/*.txt": "." });

    // eleventyConfig.addPassthroughCopy({ "_assets/CNAME": "." });

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes"
        }
    };
};