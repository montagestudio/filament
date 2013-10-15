/**
 * @module ui/package-dependencies-groups.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("../../../core/mime-types"),
    DependencyNames = require('../../../core/package-tools').DependencyNames;

/**
 * @class PackageDependenciesGroups
 * @extends Component
 */
exports.PackageDependenciesGroups = Component.specialize(/** @lends PackageDependenciesGroups# */ {
    constructor: {
        value: function PackageDependenciesGroups() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.addEventListener("dragstart", this, false);
                this.element.addEventListener("dragend", this, false);
            }
        }
    },

    editingDocument: {
        value: null
    },

    /**
     *  The current selected dependency.
     * @type {Object}
     * @default null
     */
    selectedCell: {
        value: null
    },

    /**
     * Sets the current selected dependency.
     * @function
     * @param {Object} cell, represents the future selected dependency.
     * @private
     */
    _changeSelection: {
        value: function (cell) {
            if (cell) {
                if (this.selectedCell && cell.type !== this.selectedCell.type) { // Needs manual change.
                    this.deselectPreviousCategory();
                }

                this.selectedCell = cell;
            }
        }
    },

    deselectPreviousCategory: {
        value: function () {
            if (this.selectedCell) {
                var oldType = this.selectedCell.type;

                if (oldType === DependencyNames.dependencies) {
                    this.templateObjects.dependenciesGroup.contentController.clearSelection();
                } else if (oldType === DependencyNames.optionalDependencies) {
                    this.templateObjects.optionalDependenciesGroup.contentController.clearSelection();
                } else if (oldType === DependencyNames.devDependencies) {
                    this.templateObjects.devDependenciesGroup.contentController.clearSelection();
                }
            }
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
                var type = dependency.type;

                if (type === DependencyNames.dependencies) {
                    this.templateObjects.dependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.optionalDependencies) {
                    this.templateObjects.optionalDependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.devDependencies) {
                    this.templateObjects.devDependenciesGroup.contentController.select(dependency);
                }
            }
        }
    },

    forceDisplayGroups: {
        value: function (force) {
            var templateObjects = this.templateObjects;
            templateObjects.optionalDependenciesGroup.forceDisplay =
                templateObjects.devDependenciesGroup.forceDisplay =
                templateObjects.dependenciesGroup.forceDisplay = !!force;
        }
    },

    _groupAcceptDrop: {
        value: function (type, accept) {
            var response = null;

            if (type === DependencyNames.dependencies) {
                response = this.templateObjects.dependenciesGroup.canAcceptDrop = !!accept;
            } else if (type === DependencyNames.optionalDependencies) {
                response = this.templateObjects.optionalDependenciesGroup.canAcceptDrop = !!accept;
            } else if (type === DependencyNames.devDependencies) {
                response = this.templateObjects.devDependenciesGroup.canAcceptDrop = !!accept;
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
