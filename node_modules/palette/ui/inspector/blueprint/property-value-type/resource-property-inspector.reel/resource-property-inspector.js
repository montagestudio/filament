/**
 * @module ui/resource-property-inspector.reel
 * @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 * @class ResourcePropertyInspector
 * @extends Component
 */
exports.ResourcePropertyInspector = ValueTypeInspector.specialize(/** @lends ResourcePropertyInspector# */ {

    constructor: {
        value: function ResourcePropertyInspector() {
            this.super();
            this.addOwnPropertyChangeListener("objectValue", this);
        }
    },

    fileName: {
        value: null
    },

    isEditing: {
        value: false
    },

    shouldBeFocus: {
        value: false
    },

    enterDocument: {
        value: function () {
            this.element.addEventListener("drop", this, false);
            this.element.addEventListener("dragover", this, false);
            this.element.addEventListener("dragleave", this, false);
        }
    },

    exitDocument: {
        value: function () {
            this.element.removeEventListener("drop", this, false);
            this.element.removeEventListener("dragover", this, false);
            this.element.removeEventListener("dragleave", this, false);
        }
    },

    _dispatchDidSetResourceProperty: {
        value: function () {
            this.dispatchEventNamed("didSetResourceProperty", true, false, {
                resourceProperty: this,
                value: this._objectValue
            });
        }
    },

    handleResetObjectValueAction: {
        value: function () {
            this.objectValue = null;
        }
    },

    handleObjectValueChange: {
        value: function () {
            this._updateFileName();
        }
    },

    _updateFileName: {
        value: function () {
            var path = this._objectValue;

            if (typeof this._objectValue === "string" && path.length > 0) {
                if (path[path.length - 1] === "/") {
                    path = path.slice(0, -1);
                }

                var parts = path.split("/");
                this.fileName = parts[parts.length - 1];

            } else {
                this.fileName = null;
            }
        }
    },

    handleDragover: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (!this._willAcceptDrop) {
                var availableTypes = dataTransfer.types;
                this._willAcceptDrop = availableTypes && availableTypes.has("text/plain");
            }

            if (this._willAcceptDrop) {
                dataTransfer.dropEffect = "copy";
                event.preventDefault();
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
            var dataTransfer = event.dataTransfer;

            if (dataTransfer) {
                this._objectValue = dataTransfer.getData("text/plain") || "";
                this._willAcceptDrop = false;

                if (this._objectValue) {
                    this._updateFileName();
                }

                // Fixme: remove it.
                // Temporary here in order to eventually convert a collada file.
                this._dispatchDidSetResourceProperty();

                event.preventDefault();
            }
        }
    }

});
