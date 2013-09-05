/**
 * @module ui/dependency-information.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class DependencyInformation
 * @extends Component
 */
exports.DependencyInformation = Component.specialize(/** @lends DependencyInformation# */ {

    constructor: {
        value: function DependencyInformation() {
            this.super();
        }
    },

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     */
    editingDocument: {
        value: null
    },

    _currentDependency: {
        value: null
    },

    /**
     * Reference to the current selected dependency.
     * Determines if the current selected dependency has some errors.
     * @type {Object}
     * @default null
     */
    currentDependency: {
        set: function (module) {
            if (module && typeof module === "object") {
                this._currentDependency = module;
                this.hasError = (this.currentDependency && Array.isArray(this.currentDependency.problems) &&
                    this.currentDependency.problems.length > 0);
            } else { // Can be null
                this._currentDependency = null;
                this.hasError =  false;
            }
        },
        get: function () {
            return this._currentDependency;
        }
    },

    /**
     * True if the current selected dependency has some errors.
     * @type {Boolean}
     * @default false
     */
    hasError: {
        value: false
    }

});
