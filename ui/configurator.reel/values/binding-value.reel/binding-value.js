/**
 * @module ui/binding-value.reel
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField;

/**
 * @class BindingValue
 * @extends AbstractTextField
 */
exports.BindingValue = AbstractTextField.specialize(/** @lends BindingValue# */ {
    constructor: {
        value: function BindingValue() {
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
