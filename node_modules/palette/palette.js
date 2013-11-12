exports.Palette = {

    stringifySerialization: function(object) {
        return JSON.stringify(object, null, 4)
            .replace(/\{\s*(\"[#@]\")\s*:\s*(\"[^\"]+\")\s*\}/g, "{$1: $2}")
            .replace(/\{\s*(\"(?:<-|<->)\")\s*:\s*(\"[^\"]+\"\s*(?:,\s*\"converter\"\s*:\s*\{\s*\"@\"\s*:\s*\"[^\"]+\"\s*\}\s*|,\s*\"deferred\"\s*:\s*(true|false)\s*)*)\}/g, function(_, g1, g2) {
                return "{" + g1 + ": " + g2.replace(/,\s*/, ", ").replace(/\n\s*/, "") + "}";
            });
    }

};
