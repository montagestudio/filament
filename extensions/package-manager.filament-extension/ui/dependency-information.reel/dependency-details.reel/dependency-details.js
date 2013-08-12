/**
 * @module ui/dependency-details.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DependencyDetails
 * @extends Component
 */
exports.DependencyDetails = Component.specialize(/** @lends DependencyDetails# */ {

    constructor: {
        value: function DependencyDetails() {
            this.super();
        }
    },

    /**
     * Reference to the current selected dependency.
     * @type {Object}
     * @default null
     */
    currentDependency: {
        value: null
    }

});
