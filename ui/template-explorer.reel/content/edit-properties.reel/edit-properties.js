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

function clone(propertyBlueprints) {
    return propertyBlueprints.map(function (propertyBlueprint) {
        var clone = new PropertyBlueprint();
        clone.deserializeSelf({
            getProperty: function (name) {
                return propertyBlueprint[name];
            }
        });
        return clone;
    });
}

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

                value.editingDocument._ownerBlueprint
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
                this.propertiesController.content = clone(value.addPropertyBlueprintGroupNamed(this.ownerObject.exportName));
            }
        }
    },

    propertiesController: {
        value: null
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
                    property.addOwnPropertyChangeListener("valueType", this);
                    property.addOwnPropertyChangeListener("cardinality", this);
                    property.addOwnPropertyChangeListener("collectionValueType", this);
                }, this);
                minus.forEach(function (property) {
                    property.removeOwnPropertyChangeListener("valueType", this);
                    property.removeOwnPropertyChangeListener("cardinality", this);
                    property.removeOwnPropertyChangeListener("collectionValueType", this);
                }, this);
            }
        }
    },

    handlePropertyChange: {
        value: function (value, key, object) {
            this._ownerObject.editingDocument.modifyOwnerBlueprintProperty(object.name, key, value).done();
        }
    },

    handleAddPropertyAction: {
        value: function () {
            this.addProperty();
        }
    },

    handleAddNameAction: {
        value: function () {
            this.addProperty();
        }
    },

    addProperty: {
        value: function (event) {
            var name = this.templateObjects.addName.value;
            if (!name) {
                return;
            }
            // Check if this property name already exists
            // The check should also be in blueprints, but this way we can
            // stop sooner and (not) update the UI sooner.
            if (this.ownerBlueprint.propertyBlueprints.map(function (p) { return p.name; }).indexOf(name) !== -1) {
                return;
            }

            this._ownerObject.editingDocument.addOwnerBlueprintProperty(name).done();
            this.templateObjects.addName.value = "";
        }
    },

    handleRemovePropertyAction: {
        value: function (event) {
            this._ownerObject.editingDocument.removeOwnerBlueprintProperty(event.detail.get('name')).done();
        }
    }

});
