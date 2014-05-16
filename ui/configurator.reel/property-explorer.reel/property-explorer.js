/**
 * @module ui/property-explorer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
 * @class PropertyExplorer
 * @extends Component
 */
exports.PropertyExplorer = Component.specialize(/** @lends PropertyExplorer# */ {
    constructor: {
        value: function PropertyExplorer() {
            this.super();
            this.defineBinding("_bindings", {
                "<-": "templateObject.bindings.map{[targetPath, this]}.toMap()"
            });
            this.defineBinding("properties", {
                "<-": "objectBlueprint.propertyBlueprints.map{{" +
                    "templateObject: ^templateObject, " +
                    "blueprint: this, " +
                    "value: ^_bindings.get(this.name) ?? ^templateObject.properties.get(this.name), " +
                    "type: ^_bindings.get(this.name).defined() ? (^_bindings.get(this.name).oneway ? 'one-way-binding' : 'two-way-binding') : 'assignment'" +
                "}}"
            });

            this.addPathChangeListener("this.templateObjects.addPropertyListRangeController.selection.0", this, "handleAddPropertySelection");
        }
    },

    properties: {
        value: null
    },

    _templateObject: {
        value: null
    },
    templateObject: {
        get: function () {
            return this._templateObject;
        },
        set: function (value) {
            if (value === this._templateObject) {
                return;
            }

            var self = this;
            this._templateObject = value;
            this.objectBlueprint = null;
            if (value) {
                value.proxyBlueprint.then(function (blueprint) {
                    // Check if the inspected object is still the same.
                    if (self._templateObject === value) {
                        self.objectBlueprint = blueprint;
                    }
                }).done();
            }

            this.needsDraw = true;
        }
    },

    _addProperty: {
        value: function(propertyName) {
            var editingDocument = this.templateObject._editingDocument;

            editingDocument.setOwnedObjectProperty(this.templateObject,
                propertyName, "");
        }
    },

    templateDidLoad: {
        value: function() {
            this._filterPathHack = this.templateObjects.rangeController.filterPath;
        }
    },

    /**
     * This is a hack to get around the _orderedContent not getting updated in
     * RangeController.
     */
    _filterPathHack: {
        value: null
    },
    _removeProperty: {
        value: function(propertyName) {
            var editingDocument = this.templateObject._editingDocument;
            var rangeController = this.templateObjects.rangeController;

            if (this._bindings.has(propertyName)) {
                editingDocument.cancelOwnedObjectBinding(this.templateObject,
                    this._bindings.get(propertyName));
                // Even if this is a binding there could still be a property
                // that came from the declaration, so remove it.
                this.templateObject.deleteObjectProperty(propertyName);
            } else {
                editingDocument.deleteOwnedObjectProperty(this.templateObject,
                    propertyName);
            }

            // HACK: for some reason the rangeController is not getting updated
            // when the content changes. To force it to recompute the binding
            // we touch the filterPath property.
            if (rangeController.filterPath === this._filterPathHack) {
                rangeController.filterPath = this._filterPathHack + " ";
            } else {
                rangeController.filterPath = this._filterPathHack;
            }

        }
    },

    /**
     * Used to prevent blueprint being resolved if this.object changes
     * while the blueprint is being loaded.
     *
     * Takes advantage of the fact that a promise cannot be resolved after
     * being rejected and vice versa.
     * @type {Promise}
     * @private
     */
    _blueprintDeferred: {
        value: null
    },

    objectBlueprint: {
        serializable: false,
        value: null
    },

    handleAddButtonAction: {
        value: function() {
            this.templateObjects.addPropertyListOverlay.show();
        }
    },

    handleAddPropertySelection: {
        value: function(value) {
            if (value) {
                this._addProperty(value.blueprint.name);
                this.templateObjects.addPropertyListOverlay.hide();
                this.templateObjects.addPropertyListRangeController.clearSelection();
            }
        }
    },

    handleRemoveProperty: {
        value: function(event) {
            this._removeProperty(event.detail.propertyName);
        }
    }
});
