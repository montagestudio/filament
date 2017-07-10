/**
    @module "ui/edit-properties.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    Serializer = require("montage/core/serialization/serializer/montage-serializer").MontageSerializer;

/**
    Description TODO
    @class module:"ui/edit-properties.reel".EditProperties
    @extends module:montage/ui/component.Component
*/
exports.EditProperties = Component.specialize({

    constructor: {
        value: function EditProperties() {
            this.propertiesController =  new RangeController();
            this.eventsController =  new RangeController();
        }
    },

    _editingDocument: {
        value: null
    },
    editingDocument: {
        get: function () {
            return this._editingDocument;
        },
        set: function (value) {
            var self = this;

            if (this._editingDocument === value) {
                return;
            }

            this._editingDocument = value;

            if (value) {
                value._ownerBlueprint
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
                this.propertiesController.content = value.addPropertyDescriptorGroupNamed(this.ownerObject.exportName);
                this.eventsController.content = value.eventDescriptors;
            }
        }
    },

    propertiesController: {
        value: null
    },

    handleValueTypeAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.value;
            this.editingDocument.modifyOwnerBlueprintProperty(name, "valueType", value).done();
        }
    },

    handleCollectionValueTypeAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.value;
            this.editingDocument.modifyOwnerBlueprintProperty(name, "collectionValueType", value).done();
        }
    },

    handleMultipleAction: {
        value: function (event) {
            var target = event.target;
            var name = target.propertyBlueprint.name;
            var value = target.checked ? Infinity : 1;
            this.editingDocument.modifyOwnerBlueprintProperty(name, "cardinality", value).done();
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
            if (this.ownerBlueprint.propertyDescriptors.map(function (p) { return p.name; }).indexOf(name) !== -1) {
                event.preventDefault();
                return;
            }

            this.editingDocument.addOwnerBlueprintProperty(name).done();
        }
    },

    handlePropertiesRemove: {
        value: function (event) {
            this.editingDocument.removeOwnerBlueprintProperty(event.detail.name).done();
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
            if (this.ownerBlueprint.eventDescriptors.some(function (p) { return p.name === name; })) {
                event.preventDefault();
                return;
            }

            this.editingDocument.addOwnerBlueprintEvent(name).done();
        }
    },

    handleEventsRemove: {
        value: function (event) {
            this.editingDocument.removeOwnerBlueprintEvent(event.detail.name).done();
        }
    }

});
