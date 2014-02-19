/**
 * @module ui/package-dependency-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIME_TYPES = require("../../../../../core/mime-types");

/**
 * @class PackageDependencyCell
 * @extends Component
 */
exports.PackageDependencyCell = Component.specialize(/** @lends PackageDependencyCell# */ {

    constructor: {
        value: function PackageDependencyCell() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, true);
            }
        }
    },

    editingDocument: {
        value: null
    },

    _dependency: {
        value: null
    },

    /**
     * Cell's dependency
     * @type {Object}
     * @default null
     */
    dependency: {
        set: function (module) {
            if (module && typeof module === "object" && module.hasOwnProperty('name')) {
                this._dependency = module;
            }
        },
        get: function () {
            return this._dependency;
        }
    },

    captureDragstart: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;
            dataTransfer.effectAllowed = 'move';
            dataTransfer.setData(MIME_TYPES.PACKAGE_MANAGER_SERIALIZATION_DEPENDENCY, this._dependency.name);
            dataTransfer.setData(MIME_TYPES.PACKAGE_MANAGER_DEPENDENCY_TYPE, this._dependency.type);
        }
    }

});
