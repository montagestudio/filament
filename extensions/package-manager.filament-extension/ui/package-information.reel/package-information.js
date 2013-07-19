/**
 * @module ui/package-information.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformation
 * @extends Component
 */
exports.PackageInformation = Component.specialize(/** @lends PackageInformation# */ {

    constructor: {
        value: function PackageInformation() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    }

});
