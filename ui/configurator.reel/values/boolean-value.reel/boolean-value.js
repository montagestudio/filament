/**
 * @module ui/boolean-value.reel
 */
var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;

/**
 * @class BooleanValue
 * @extends AbstractCheckbox
 */
exports.BooleanValue = AbstractCheckbox.specialize(/** @lends BooleanValue# */ {
    constructor: {
        value: function BooleanValue() {
            this.super();
            this.defineBinding("checked", {"<-": "value"});
        }
    },

    checked: {
        set: function(value) {
            if (value !== this._checked) {
                this._checked = value;
                this.dispatchEventNamed("updatePropertyValue", true, false, {
                    value: value
                });
            }
        },
        get: function() {
            return this._checked;
        }
    },

    draw: {
        value: function() {
            this.element.checked = this.checked;
        }
    }
});
