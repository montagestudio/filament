/**
 * @module ui/package-information-description.reel
 * @requires montage/ui/component
 */
var PackageInformationBox = require("../package-information-box.reel").PackageInformationBox;

/**
 * @class PackageInformationDescription
 * @extends ui/package-information-box.reel.PackageInformationBox
 */
exports.PackageInformationDescription = PackageInformationBox.specialize(/** @lends PackageInformationDescription# */ {
    constructor: {
        value: function PackageInformationDescription() {
            this.super();
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
