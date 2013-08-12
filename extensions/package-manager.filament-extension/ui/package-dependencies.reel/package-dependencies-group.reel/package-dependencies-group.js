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

    /**
     * The list title.
     * @type {String}
     * @default null
     */
    title: {
        value: null
    },

    /**
     * Represents the content of this list.
     * @type {Array}
     * @default null
     */
    dependencies: {
        value: null
    },

    /**
     * The current selected dependency of this list.
     * @type {Object}
     * @default null
     */
    selectedCell: {
        value: null
    }

});
