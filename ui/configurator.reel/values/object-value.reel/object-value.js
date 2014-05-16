/**
 * @module ui/object-value.reel
 */
var MixedValue = require("../mixed-value.reel").MixedValue;

/**
 * @class ObjectValue
 * @extends MixedValue
 */
exports.ObjectValue = MixedValue.specialize(/** @lends ObjectValue# */ {
    constructor: {
        value: function ObjectValue() {
            this.super();
        }
    },

    templateModuleId: {
        value: "../mixed-value.reel/mixed-value.html"
    },

    _inferMode: {
        value: function(value) {
            var inferredMode;

            // object-reference mode is when we have a reference to a valid
            // label in the form of @<valid-label>.
            // binding mode is when we have a valid label and a dot leading to
            // a path in the form of @<valid-label>.
            if (/^@([a-zA-Z0-9]+)(\.)?/.test(value)) {
                var label = RegExp.$1;
                var path = RegExp.$2;
                if (label in this.objectsMap) {
                    if (path) {
                        inferredMode = "binding";
                    } else {
                        inferredMode = "object-reference";
                    }
                }
            }

            if (!inferredMode) {
                // If we're currently in object-reference mode but the new mode
                // is something we're not able to figure out then go back to
                // json.
                if (!this.mode || this.mode === "object-reference") {
                    inferredMode = "json";
                } else {
                    // Otherwise just keep on the same mode.
                    inferredMode = this.mode;
                }
            }

            return inferredMode;
        }
    }
});