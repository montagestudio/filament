/**
 * @module ui/dependency-errors.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DependencyErrors
 * @extends Component
 */
exports.DependencyErrors = Component.specialize(/** @lends DependencyErrors# */ {

    constructor: {
        value: function DependencyErrors() {
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
