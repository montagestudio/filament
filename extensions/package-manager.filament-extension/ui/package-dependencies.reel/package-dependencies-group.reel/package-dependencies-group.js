/**
 * @module ui/package-dependencies-group.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Dependency = require("../../../core/dependency").Dependency,
    MIME_TYPES = require("../../../core/mime-types");

/**
 * @class PackageDependenciesGroup
 * @extends Component
 */
exports.PackageDependenciesGroup = Component.specialize(/** @lends PackageDependenciesGroup# */ {

    constructor: {
        value: function PackageDependenciesGroup() {
            this.super();
        }
    },

    /**
     * The list title.
     * @type {String}
     * @default null
     */
    title: {
        value: null
    },

    type: {
        value: null
    },

    editingDocument: {
        value: null
    },

    /**
     * Represents the content of this list.
     * @type {Array}
     * @default null
     */
    dependencies: {
        value: null
    },

    /**
     * The current selected dependency of this list.
     * @type {Object}
     * @default null
     */
    selectedCell: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragleave", this, false);
                this._element.addEventListener("dragover", this, false);
                this._element.addEventListener("drop", this, false);
            }
        }
    },

    _willAcceptDrop: {
        value: false
    },

    canAcceptDrop: {
        value: true
    },

    forceDisplay: {
        value: false
    },

    handleDragover: {
        value: function (event) {
            var dataTransfer = event.dataTransfer,
                availableTypes = dataTransfer.types;

            if (availableTypes) {
                if (availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY) ||
                    availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_INSTALLATION_DEPENDENCY)) {

                    event.preventDefault();
                    dataTransfer.dropEffect = dataTransfer.effectAllowed;
                    this._willAcceptDrop = true;
                }
            } else {
                dataTransfer.dropEffect = "none";
                this._willAcceptDrop = false;
            }
        }
    },

    handleDragleave: {
        value: function () {
            this._willAcceptDrop = false;
        }
    },

    handleDrop: {
        value: function (event) {
            var dataTransfer = event.dataTransfer,
                availableTypes = dataTransfer.types;

            if (availableTypes) {
                if (availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY)) {
                    var dependency = JSON.parse(dataTransfer.getData(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY));

                    if (dependency.type !== this.type) {
                        this.editingDocument.switchDependencyType(dependency, this.type).done();
                    }

                } else if (availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_INSTALLATION_DEPENDENCY)) {
                    var module = JSON.parse(dataTransfer.getData(MIME_TYPES.PACKAGE_MANAGER_INSTALLATION_DEPENDENCY));

                    if (module) {
                        this.editingDocument.performActionDependency(Dependency.INSTALL_DEPENDENCY_ACTION,
                                new Dependency(module.name, module.version, this.type)).done();
                    }
                }
            }
            this._willAcceptDrop = false;
        }
    }

});
