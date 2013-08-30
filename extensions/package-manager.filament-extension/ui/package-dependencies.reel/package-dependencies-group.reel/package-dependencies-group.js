/**
 * @module ui/package-dependencies-group.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
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

            if (availableTypes && availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY)) {
                event.preventDefault();
                dataTransfer.dropEffect = "move";
                this._willAcceptDrop = true;
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

            if (availableTypes && availableTypes.has(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY)) {
                var data = dataTransfer.getData(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY),
                    dependency = JSON.parse(data);
                if (dependency.type !== this.type) {
                    this.editingDocument.replaceDependency(dependency, this.type);
                }
            }
            this._willAcceptDrop = false;
        }
    }

});
