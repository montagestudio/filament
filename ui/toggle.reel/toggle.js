/**
 * @module ui/toggle.reel
 * @requires matte/ui/input-checkbox
 */
var InputCheckbox = require("matte/ui/input-checkbox.reel").InputCheckbox;

/**
 * @class Toggle
 * @extends InputCheckbox
 */
exports.Toggle = InputCheckbox.specialize(/** @lends Toggle# */ {
    hasTemplate: {
        value: true
    },
    constructor: {
        value: function Toggle() {
            this.classList.add("Toggle");
            this.super();
        }
    }
});
