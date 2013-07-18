/**
 * @module ui/package-information-description.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationDescription
 */
exports.PackageInformationDescription = Component.specialize(/** @lends PackageInformationDescription# */ {
    constructor: {
        value: function PackageInformationDescription() {
            this.super();
        }
    },

    value: {
        value: null
    },

    willDraw: {
        value: function () {
            this.element.addEventListener("input", this);
        }
    },

    handleInput: {
        value: function (event) {
            this.value = event.target.value;
            this.dispatchEventNamed("changed", true, true, {
                source: event.target
            });
        }
    }
});
