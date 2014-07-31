/**
 * @module ui/string-value.reel
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField;

/**
 * @class StringValue
 * @extends AbstractTextField
 */
exports.StringValue = AbstractTextField.specialize(/** @lends StringValue# */ {
    constructor: {
        value: function StringValue() {
            this.super();
        }
    },

    hasTemplate: {
        value: true
    },

    _updateValueFromDom: {
        value: function() {
            this.super();
            this.dispatchEventNamed("updatePropertyValue", true, false, {
                value: this.value
            });
        }
    }
});
