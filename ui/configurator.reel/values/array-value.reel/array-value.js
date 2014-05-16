/**
 * @module ui/array-value.reel
 */
var MixedValue = require("../mixed-value.reel").MixedValue;

/**
 * @class ArrayValue
 * @extends Component
 */
exports.ArrayValue = MixedValue.specialize(/** @lends ArrayValue# */ {
    constructor: {
        value: function ArrayValue() {
            this.super();
        }
    },

    templateModuleId: {
        value: "../mixed-value.reel/mixed-value.html"
    },

    _inferMode: {
        value: function(value) {
            var inferredMode;

            // binding mode is when we have a valid label and a dot leading to
            // a path in the form of @<valid-label>.
            if (/^@([a-zA-Z0-9]+)\./.test(value)) {
                var label = RegExp.$1;
                if (label in this.objectsMap) {
                    inferredMode = "binding";
                }
            }

            if (!inferredMode) {
                // If we're currently in object-reference mode but the new mode
                // is something we're not able to figure out then go back to
                // json.
                if (!this.mode) {
                    inferredMode = "json-array";
                } else {
                    // Otherwise just keep on the same mode.
                    inferredMode = this.mode;
                }
            }

            return inferredMode;
        }
    }
});
