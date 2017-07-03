/**
    @module "./property-group-editor.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    PropertyModel = require("core/property-model").PropertyModel;

/**
    Description TODO
    @class module:"./property-group-editor.reel".PropertyGroupEditor
    @extends module:montage/ui/component.Component
*/
exports.PropertyGroupEditor = Component.specialize(/** @lends module:"./property-group-editor.reel".PropertyGroupEditor# */ {

    editingDocument: {
        value: null
    },

    object: {
        value: null
    },

    objectBlueprint: {
        value: null
    },

    name: {
        value: null
    },

    properties: {
        value: null
    },

    _open: {
        value: false
    },

    open: {
        get: function () {
            return this._open;
        },
        set: function (value) {
            if (this._open === value) {
                return;
            }
            this._open = value;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            this.element.open = this._open;
        }
    },

    handleAddPropertyButtonAction: {
        value: function (event) {
            var propertyModel = new PropertyModel(this.object, this.objectBlueprint, "");
            var existingPropertyKeys = this.objectBlueprint.propertyDescriptors.map(function (descriptor) {
                return descriptor.name;
            }).concat(this.object.properties.keysArray());
            this.dispatchEventNamed("addProperty", true, false, {
                propertyModel: propertyModel,
                existingPropertyKeys: existingPropertyKeys
            });
        }
    }
});
