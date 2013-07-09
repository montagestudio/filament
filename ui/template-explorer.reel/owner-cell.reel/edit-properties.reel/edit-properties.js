/**
    @module "ui/edit-properties.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController,
    PropertyBlueprint = require("montage/core/meta/property-blueprint").PropertyBlueprint;

/**
    Description TODO
    @class module:"ui/edit-properties.reel".EditProperties
    @extends module:montage/ui/component.Component
*/
exports.EditProperties = Component.specialize({

    constructor: {
        value: function () {
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
            this._ownerObject = value;

            if (value) {
                var self = this;

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
                this.propertiesController.content = value.propertyBlueprintGroupForName("default");
            }
        }
    },

    handlePropertiesRangeChange: {
        value: function (plus, minus) {
            if (this._ownerBlueprint) {
                var ownerBlueprint = this._ownerBlueprint;

                plus.forEach(ownerBlueprint.addPropertyBlueprint.bind(ownerBlueprint));
                minus.forEach(ownerBlueprint.removePropertyBlueprint.bind(ownerBlueprint));
            }
        }
    },

    propertiesController: {
        value: null
    },

    handleAddPropertyAction: {
        value: function (event) {
            this.propertiesController.addContent();
        }
    },

    handleRemovePropertyAction: {
        value: function (event) {
            this.propertiesController.delete(event.detail.get('propertyBlueprint'));
        }
    }

});
