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
    },

    _label: {
        value: null
    },

    label: {
        get: function() {
            return this._label;
        },
        set: function(value) {
            this._label = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function() {
            this.super();

            var label = this._label;
            if (label) {
                this.element.setAttribute("aria-label", label);
            } else {
                this.element.removeAttribute("aria-label");
            }
        }
    }
});
