/**
    @module "ui/edit-properties.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint,
    Serializer = require("montage/core/serialization").Serializer,
    Promise = require("montage/core/promise").Promise;

/**
    Description TODO
    @class module:"ui/edit-properties.reel".EditProperties
    @extends module:montage/ui/component.Component
*/
exports.EditProperties = Component.specialize({

    constructor: {
        value: function EditProperties() {
            var propertiesController =  RangeController.create();
            propertiesController.contentConstructor = PropertyBlueprint;
            propertiesController.organizedContent.addRangeChangeListener(this, "properties");

            this.propertiesController = propertiesController;
        }
    },

    _ownerObject: {
        value: null
    },
    ownerObject: {
        get: function() {
            return this._ownerObject;
        },
        set: function(value) {
            if (this._ownerObject === value) {
                return;
            }

            if (this._ownerObject) {
                this._ownerObject.editingDocument.unregisterFile("meta");
            }

            this._ownerObject = value;

            if (value) {
                var self = this;

                value.editingDocument.registerFile("meta", this._saveMeta, this);

                value.packageRequire.async(value.moduleId)
                .get(value.exportName)
                .get("blueprint")
                .then(function (blueprint) {
                    self.ownerBlueprint = blueprint;
                })
                .done();
            } else {
                this.ownerBlueprint = void 0;
            }
        }
    },

    _ownerBlueprint: {
        value: null
    },
    ownerBlueprint: {
        get: function() {
            return this._ownerBlueprint;
        },
        set: function(value) {
            if (this._ownerBlueprint === value) {
                return;
            }
            this._ownerBlueprint = value;
            if (value) {
                // add... returns the existing group if it already exists
                this.propertiesController.content = value.addPropertyBlueprintGroupNamed("default");
            }
        }
    },

    _saveMeta: {
        value: function (location, dataWriter) {
            var serializer = Serializer.create().initWithRequire(this.ownerObject.editingDocument._packageRequire);
            var serializedDescription = serializer.serializeObject(this.ownerBlueprint);
            return dataWriter(serializedDescription, location);
        }
    },

    handlePropertiesRangeChange: {
        value: function (plus, minus) {
            if (this._ownerBlueprint) {
                var ownerBlueprint = this._ownerBlueprint;

                plus.forEach(function (property) {
                    ownerBlueprint.addPropertyBlueprint(property);
                    property.addBeforeOwnPropertyChangeListener("valueType", this);
                    property.addBeforeOwnPropertyChangeListener("cardinality", this);
                    property.addBeforeOwnPropertyChangeListener("collectionValueType", this);
                }, this);
                minus.forEach(function (property) {
                    ownerBlueprint.removePropertyBlueprint(property);
                    property.removeBeforeOwnPropertyChangeListener("valueType", this);
                    property.removeBeforeOwnPropertyChangeListener("cardinality", this);
                    property.removeBeforeOwnPropertyChangeListener("collectionValueType", this);
                });
            }
        }
    },

    propertiesController: {
        value: null
    },

    modifyProperty: {
        value: function (propertyBlueprint, property, value) {
            var previousValue = propertyBlueprint[property];
            propertyBlueprint[property] = value;
            this._ownerObject.editingDocument.undoManager.register(
                "Modify owner property",
                Promise.resolve([this.modifyProperty, this, propertyBlueprint, property, previousValue])
            );
        }
    },

    addProperty: {
        value: function (propertyBlueprint) {
            this.propertiesController.add(propertyBlueprint);
            this._ownerObject.editingDocument.undoManager.register(
                "Add owner property",
                Promise.resolve([this.removeProperty, this, propertyBlueprint])
            );
        }
    },

    removeProperty: {
        value: function (propertyBlueprint) {
            this.propertiesController.delete(propertyBlueprint);
            this._ownerObject.editingDocument.undoManager.register(
                "Remove owner property",
                Promise.resolve([this.addProperty, this, propertyBlueprint])
            );
        }
    },

    handlePropertyWillChange: {
        value: function (value, key, object) {
            this.modifyProperty(object, key, value);
        }
    },

    handleAddPropertyAction: {
        value: function (event) {
            var name = this.templateObjects.addName.value;
            if (!name) {
                return;
            }
            var property = new PropertyBlueprint().initWithNameBlueprintAndCardinality(name, this.ownerBlueprint, 1);
            this.addProperty(property);
            this.templateObjects.addName.value = "";
        }
    },

    handleRemovePropertyAction: {
        value: function (event) {
            this.removeProperty(event.detail.get('propertyBlueprint'));
        }
    }

});
