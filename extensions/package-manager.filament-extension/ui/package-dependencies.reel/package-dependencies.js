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
    },

    selectedCell: {
        value: null
    },

    /**
     * Displays the install dependency overlay form.
     * @function
     */
    handleAddDependencyButtonAction: {
        value: function() {
            this.installDependencyOverlay.show();
        }
    },

    forceDisplayGroups: {
        value: function (force) {
            var dependenciesGroups = this.templateObjects.dependenciesGroups;

            if (dependenciesGroups) {
                dependenciesGroups.forceDisplayGroups(force);
            }
        }
    },

    acceptDrop: {
        value: function (event) {
            var dependenciesGroups = this.templateObjects.dependenciesGroups;

            if (dependenciesGroups) {
                dependenciesGroups.handleAcceptDrop(event);
            }
        }
    },

    updateSelection: {
        value: function (dependency) {
            var dependenciesGroups = this.templateObjects.dependenciesGroups;

            if (dependenciesGroups) {
                dependenciesGroups.updateSelection(dependency);
            }
        }
    }

});
