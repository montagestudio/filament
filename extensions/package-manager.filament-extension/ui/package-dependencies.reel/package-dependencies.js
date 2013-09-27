/**
 * @module ui/package-dependencies.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("../../core/mime-types"),
    DependencyNames = require('../../core/package-tools').DependencyNames;

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

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("dragstart", this, false);
                this.element.addEventListener("dragend", this, false);
                this.addOwnPropertyChangeListener("selectedDependency", this, true);
                this.addOwnPropertyChangeListener("selectedDependency", this, false);
            }
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
                if (this._selectedCell.type === DependencyNames.dependencies) {
                    this.templateObjects.packageDependenciesGroup.contentController.clearSelection();
                } else if (this._selectedCell.type === DependencyNames.optionalDependencies) {
                    this.templateObjects.packageOptionalDependenciesGroup.contentController.clearSelection();
                } else if (this._selectedCell.type === DependencyNames.devDependencies) {
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
    _changeSelection: {
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
            this._changeSelection(cell);
        }
    },

    /**
     * Sets the current selected dependency from the optional dependencies list.
     * @type {Object}
     */
    optionalDependencyCell: {
        set: function (cell) {
            this._changeSelection(cell);
        }
    },

    /**
     * Sets the current selected dependency from the dev dependencies list.
     * @type {Object}
     */
    devDependencyCell: {
        set: function (cell) {
            this._changeSelection(cell);
        }
    },

    updateSelection: {
        value: function (dependency) {
            if (dependency && dependency.hasOwnProperty("type")) {
                var templateObjects = this.templateObjects,
                    type = dependency.type;

                if (type === DependencyNames.dependencies) {
                    templateObjects.packageDependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.optionalDependencies) {
                    templateObjects.packageOptionalDependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.devDependencies) {
                    templateObjects.packageDevDependenciesGroup.contentController.select(dependency);
                }
            }
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
    },

    forceDisplayGroups: {
        value: function (force) {
            var templateObjects = this.templateObjects;
            templateObjects.packageOptionalDependenciesGroup.forceDisplay =
                templateObjects.packageDevDependenciesGroup.forceDisplay =
                templateObjects.packageDependenciesGroup.forceDisplay = !!force;
        }
    },

    _groupAcceptDrop: {
        value: function (type, accept) {
            var response = null,
                templateObjects = this.templateObjects;

            if (type === DependencyNames.dependencies) {
                response = templateObjects.packageDependenciesGroup.canAcceptDrop = !!accept;
            } else if (type === DependencyNames.optionalDependencies) {
                response = templateObjects.packageOptionalDependenciesGroup.canAcceptDrop = !!accept;
            } else if (type === DependencyNames.devDependencies) {
                response = templateObjects.packageDevDependenciesGroup.canAcceptDrop = !!accept;
            }

            return (response !== null);
        }
    },

    _currentGroupNotAcceptDrop: {
        value: null
    },

    handleDragstart: {
        value: function (event) {
            this.handleAcceptDrop(event);
        }
    },

    handleAcceptDrop: {
        value: function (event) {
            var dataTransfer = event.dataTransfer,
                availableTypes = dataTransfer.types;

            if (availableTypes) {
                if (availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_DEPENDENCY_TYPE)) {
                    var groupType = dataTransfer.getData(MIME_TYPES.PACKAGE_MANAGER_DEPENDENCY_TYPE);

                    // The current dependency's type will not accept dropping.
                    if (this._groupAcceptDrop(groupType, false)) {
                        this._currentGroupNotAcceptDrop = groupType;
                        this.forceDisplayGroups(true);
                        event.stopPropagation();
                    }
                } else if (availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_INSTALLATION_DEPENDENCY)) {
                    this.forceDisplayGroups(true);
                    event.stopPropagation();
                }
            }
        }
    },

    handleDragend: {
        value: function (event) {
            if (this._currentGroupNotAcceptDrop && this._groupAcceptDrop(this._currentGroupNotAcceptDrop, true)) {
                this._currentGroupNotAcceptDrop = null;
                this.forceDisplayGroups(false);
                event.stopPropagation();
            }
        }
    }

});
