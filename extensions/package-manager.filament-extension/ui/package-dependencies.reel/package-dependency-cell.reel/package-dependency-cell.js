/**
 * @module ui/package-dependency-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageDependencyCell
 * @extends Component
 */
exports.PackageDependencyCell = Component.specialize(/** @lends PackageDependencyCell# */ {
    constructor: {
        value: function PackageDependencyCell() {
            this.super();
        }
    },

    dependency: {
        value: null
    }

});
