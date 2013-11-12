/**
 @module "./blueprint-editor.reel"
 @requires montage
 @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    RangeController = require("montage/core/range-controller").RangeController;

/**
 Description TODO
 @class module:"./blueprint-editor.reel".BlueprintEditor
 @extends module:montage/ui/component.Component
 */
exports.BlueprintEditor = Component.specialize(/** @lends module:"./blueprint-editor.reel".BlueprintEditor# */ {

    constructor: {
        value: function BlueprintEditor() {
            this.super();
            this.propertyGroupsController = RangeController.create();
        }
    },

    editingDocument: {
        value: null
    },

    _object: {
        value: null
    },

    /*
     * Target object proxy that is inspected with the blueprint
     */
    object: {
        get: function () {
            return this._object;
        },
        set: function (value) {
            if (this._object !== value) {
                this._object = value;
            }
        }
    },

    _objectBlueprint: {
        value: null
    },

    /*
     * Property blueprint that is inspected
     */
    objectBlueprint: {
        get: function () {
            return this._objectBlueprint;
        },
        set: function (value) {
            if (this._objectBlueprint !== value) {
                this._objectBlueprint = value;
                if (value != null) {
                    // we could create a binding to the propertyBlueprintGroups,
                    // but at the moment I'm not expecting the component blueprint
                    // to change at runtime
                    this.propertyGroupsController.content = value.propertyBlueprintGroups.map(function (groupName, index) {
                        return {
                            name: groupName,
                            properties: value.propertyBlueprintGroupForName(groupName),
                            open: index === 0
                        };
                    });
                }
            }
        }
    },

    propertyGroupsController: {
        serializable: false,
        value: null
    }

});
