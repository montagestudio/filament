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
     * @type {Object}
     * @default null
     */
    currentDependency: {
        value: null
    },

    handleFixDependencyErrorAction: {
        value: function () {
            var self = this;

            this.editingDocument.repairDependency(this.currentDependency.name).then(function () {
                self.currentDependency.problems = null;
            }).done();
        }
    }

});
