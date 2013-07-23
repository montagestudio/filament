/**
 * @module ui/package-dependencies.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageDependencies
 * @extends Component
 */
exports.PackageDependencies = Component.specialize(/** @lends PackageDependencies# */ {
    constructor: {
        value: function PackageDependencies() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    }

});
