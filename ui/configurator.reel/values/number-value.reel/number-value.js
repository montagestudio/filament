/**
 * @module ui/number-value.reel
 */
var AbstractNumberField = require("montage/ui/base/abstract-number-field").AbstractNumberField;
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField;

/**
 * @class AbstractNumberField
 * @extends Component
 */
exports.NumberValue = AbstractNumberField.specialize(/** @lends NumberValue# */ {
    constructor: {
        value: function NumberValue() {
            this.super();
        }
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

exports.TextField = AbstractTextField.specialize(/** @lends TextField */ {
    constructor: {
        value: function ObjectValue() {
            this.super();
        }
    },

    hasTemplate: {
        value: false
    }
});