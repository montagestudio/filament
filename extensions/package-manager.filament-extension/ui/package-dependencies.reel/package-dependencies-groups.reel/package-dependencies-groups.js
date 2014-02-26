/**
 * @module ui/package-dependencies-groups.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("../../../core/mime-types"),
    DependencyNames = require('../../../core/package-tools').DependencyNames,

    DEPENDENCY_GROUPS = {
        'regular': "dependenciesGroup",
        'optional': "optionalDependenciesGroup",
        'dev': "devDependenciesGroup"
    };

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
                this.element.addEventListener("click", this, false);
                this.dependencyGroups = {};

                var self = this;

                Object.keys(DEPENDENCY_GROUPS).forEach(function (key) {
                    self.dependencyGroups[key] = self.templateObjects[DEPENDENCY_GROUPS[key]];
                });
            }
        }
    },

    editingDocument: {
        value: null
    },

    handleClick: {
        value: function (event) {
            var target = event.target;

            if (target === this.element) {
                this.deselectPreviousCategory();
                this.selectedCell = null;
            }
        }
    },

    dependencyGroups: {
        value: null
    },

    _hasGroupRestricted: {
        value: false
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

                if (oldType === DependencyNames.regular) {
                    this.templateObjects.dependenciesGroup.contentController.clearSelection();
                } else if (oldType === DependencyNames.optional) {
                    this.templateObjects.optionalDependenciesGroup.contentController.clearSelection();
                } else if (oldType === DependencyNames.dev) {
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

                if (type === DependencyNames.regular) {
                    this.templateObjects.dependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.optional) {
                    this.templateObjects.optionalDependenciesGroup.contentController.select(dependency);
                } else if (type === DependencyNames.dev) {
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

    _restrictGroupAcceptDrop: {
        value: function (groupType) {
            var flag = null;

            this._resetGroupsState();

            if (groupType === DependencyNames.regular) {
                flag = this.dependencyGroups.regular.canAcceptDrop = false;
            } else if (groupType === DependencyNames.optional) {
                flag = this.dependencyGroups.optional.canAcceptDrop = false;
            } else if (groupType === DependencyNames.dev) {
                flag = this.dependencyGroups.dev.canAcceptDrop = false;
            }

            this._hasGroupRestricted = (flag !== null);

            return this._hasGroupRestricted;
        }
    },

    _resetGroupsState: {
        value: function () {
            var self = this;

            if (this._hasGroupRestricted) {
                Object.keys(this.dependencyGroups).forEach(function (groupKey) {
                    self.dependencyGroups[groupKey].canAcceptDrop = true; // default value
                });
            }

            this._hasGroupRestricted = false;
            this.forceDisplayGroups(false);
        }
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
                    if (this._restrictGroupAcceptDrop(groupType)) {
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
            if (this._hasGroupRestricted) {
                this._resetGroupsState();
                event.stopPropagation();
            }
        }
    }

});
