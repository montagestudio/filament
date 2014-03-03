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

    _loadingDependency: {
        value: false
    },

    loadingDependency: {
        set: function (loading) {
            this._loadingDependency = !!loading;
        },
        get: function () {
            return this._loadingDependency;
        }
    },

    /**
     * Reference to the current selected dependency.
     * Determines if the current selected dependency has some errors.
     * @type {Object}
     * @default null
     */
    currentDependency: {
        set: function (module) {
            this._currentDependency = module;
            this.hasError = (module && Array.isArray(module.problems) && module.problems.length > 0);
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
    },

    handleFixDependencyErrorAction: {
        value: function () {
            this.editingDocument.repairDependency(this.currentDependency.name);
        }
    }

});
