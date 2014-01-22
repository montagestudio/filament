/**
    @module "ui/edit-properties.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    Serializer = require("montage/core/serialization").Serializer;

/**
    Description TODO
    @class module:"ui/edit-properties.reel".EditProperties
    @extends module:montage/ui/component.Component
*/
exports.EditProperties = Component.specialize({

    constructor: {
        value: function EditProperties() {
            this.propertiesController =  RangeController.create();
            this.eventsController =  RangeController.create();
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
                this.propertiesController.content = value.addPropertyBlueprintGroupNamed(this.ownerObject.exportName);
                this.eventsController.content = value.eventBlueprints;
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

    handleValueTypeAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.value;
            this._ownerObject.editingDocument.modifyOwnerBlueprintProperty(name, "valueType", value).done();
        }
    },

    handleCollectionValueTypeAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.value;
            this._ownerObject.editingDocument.modifyOwnerBlueprintProperty(name, "collectionValueType", value).done();
        }
    },

    handleMultipleAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.checked ? Infinity : 1;
            this._ownerObject.editingDocument.modifyOwnerBlueprintProperty(name, "cardinality", value).done();
        }
    },

    handlePropertiesAdd: {
        value: function (event) {
            event.stopPropagation();
            var name = event.detail;

            if (!name) {
                event.preventDefault();
                return;
            }
            // Check if this property name already exists
            // The check should also be in blueprints, but this way we can
            // stop sooner and (not) update the UI sooner.
            if (this.ownerBlueprint.propertyBlueprints.map(function (p) { return p.name; }).indexOf(name) !== -1) {
                event.preventDefault();
                return;
            }

            this._ownerObject.editingDocument.addOwnerBlueprintProperty(name).done();
        }
    },

    handlePropertiesRemove: {
        value: function (event) {
            this._ownerObject.editingDocument.removeOwnerBlueprintProperty(event.detail.name).done();
        }
    },

    // Events

    handleEventsAdd: {
        value: function (event) {
            event.stopPropagation();
            var name = event.detail;

            if (!name) {
                event.preventDefault();
                return;
            }
            // Check if this event name already exists
            // The check should also be in blueprints, but this way we can
            // stop sooner and (not) update the UI sooner.
            if (this.ownerBlueprint.eventBlueprints.some(function (p) { return p.name === name; })) {
                event.preventDefault();
                return;
            }

            this._ownerObject.editingDocument.addOwnerBlueprintEvent(name).done();
        }
    },

    handleEventsRemove: {
        value: function (event) {
            this._ownerObject.editingDocument.removeOwnerBlueprintEvent(event.detail.name).done();
        }
    }

});
