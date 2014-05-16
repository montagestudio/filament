/**
 * @module ui/property-name.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PropertyName
 * @extends Component
 */
exports.PropertyName = Component.specialize(/** @lends PropertyName# */ {
    constructor: {
        value: function PropertyName() {
            this.super();
            this.classList.add("PropertyName");
        }
    },

    hasTemplate: {
        value: false
    },

    _value: {
        value: null
    },

    value: {
        set: function(value) {
            if (value !== this._value) {
                this._value = value;
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._value;
        }
    },

    draw: {
        value: function() {
            this.element.textContent = this.value;
            this.element.setAttribute("title", this.value);
        }
    }
});
