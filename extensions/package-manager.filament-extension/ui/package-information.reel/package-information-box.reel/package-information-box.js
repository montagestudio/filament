/**
 * @module ui/package-information-box.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationBox
 * @extends Component
 */
exports.PackageInformationBox = Component.specialize(/** @lends PackageInformationBox# */ {
    constructor: {
        value: function PackageInformationBox() {
            this.super();
        }
    },

    _title:{
        value: ''
    },

    title: {
        set: function (title) {
            if(typeof title === 'string') {
                this._title = title;
            }
        },
        get: function () {
            return this._title;
        }
    },

    _value: {
        value: ''
    },

    value: {
        set: function (value) {
            if (typeof value === 'string') {
                this._value = value;
            }
        },
        get: function () {
            return this._value;
        }
    },

    pattern: {
        value: null
    },

    willDraw: {
        value: function () {
            this.element.addEventListener("input", this);
            if (typeof this.pattern === 'function') {
                if (!this.pattern(this.value)) {
                    this.inputText.element.setCustomValidity('not valid');
                }
            }
        }
    },

    handleInput: {
        value: function (event) {
            this.dispatchEventNamed("changed", true, true, {
                source: event.target
            });
        }
    }

});
