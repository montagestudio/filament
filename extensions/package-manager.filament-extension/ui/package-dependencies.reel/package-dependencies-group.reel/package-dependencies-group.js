/**
 * @module ui/package-dependencies-group.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageDependenciesGroup
 * @extends Component
 */
exports.PackageDependenciesGroup = Component.specialize(/** @lends PackageDependenciesGroup# */ {
    constructor: {
        value: function PackageDependenciesGroup() {
            this.super();
        }
    },

    title: {
        value: null
    },

    dependencies: {
        value: null
    }

});
