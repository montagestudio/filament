/**
 * @module ui/package-dependencies.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    DEPENDENCY_TYPE_REGULAR = 'regular',
    DEPENDENCY_TYPE_OPTIONAL = 'optional',
    DEPENDENCY_TYPE_DEV = 'dev';

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

    didDraw: {
        value: function () {
            this.addOwnPropertyChangeListener("selectedDependency", this, true);
            this.addOwnPropertyChangeListener("selectedDependency", this, false);
        }
    },

    editingDocument: {
        value: null
    },

    /**
     * Reference to the packageEditor.
     * @type {Object}
     * @default null
     */
    packageEditor: {
        value: null
    },

    _selectedCell: {
        value: null
    },

    /**
     *  The current selected dependency.
     * @type {Object}
     * @default null
     */
    selectedCell: {
        set: function (cell) {
            this._selectedCell = cell;
        },
        get: function () {
            return this._selectedCell;
        }
    },

    /**
     * Determines whether the future selected dependency belongs to the current selected list,
     * if not then clear the current list selection.
     * @function
     * @param {Object} cell, represents the dependency which will be selected
     */
    handleSelectedDependencyWillChange: {
        value: function (cell) {
            if (this._selectedCell && cell && cell.type !== this._selectedCell.type) { // Needs manual change.
                if (this._selectedCell.type === DEPENDENCY_TYPE_REGULAR) {
                    this.templateObjects.packageDependenciesGroup.contentController.clearSelection();
                } else if (this._selectedCell.type === DEPENDENCY_TYPE_OPTIONAL) {
                    this.templateObjects.packageOptionalDependenciesGroup.contentController.clearSelection();
                } else if (this._selectedCell.type === DEPENDENCY_TYPE_DEV) {
                    this.templateObjects.packageDevDependenciesGroup.contentController.clearSelection();
                }
            }
        }
    },

    /**
     * Sets the current selected dependency.
     * @function
     * @param {Object} cell, represents the current selected dependency.
     */
    handleSelectedDependencyChange: {
        value: function (cell) {
            this.selectedCell = cell;
        }
    },

    /**
     * Sets the current selected dependency.
     * @function
     * @param {Object} cell, represents the future selected dependency.
     * @private
     */
    _manualChange: {
        value: function (cell) {
            this.dispatchBeforeOwnPropertyChange('selectedDependency', cell);
            this.dispatchOwnPropertyChange('selectedDependency', cell);
        }
    },

    /**
     * Sets the current selected dependency from the regular dependencies list.
     * @function {Object}
     */
    dependencyCell: {
        set: function (cell) {
            this._manualChange(cell);
        }
    },

    /**
     * Sets the current selected dependency from the optional dependencies list.
     * @type {Object}
     */
    optionalDependencyCell: {
        set: function (cell) {
            this._manualChange(cell);
        }
    },

    /**
     * Sets the current selected dependency from the dev dependencies list.
     * @type {Object}
     */
    devDependencyCell: {
        set: function (cell) {
            this._manualChange(cell);
        }
    },

    /**
     * Displays the install dependency overlay form.
     * @function
     */
    handleAddDependencyButtonAction: {
        value: function() {
            this.installDependencyOverlay.show();
        }
    }

});
