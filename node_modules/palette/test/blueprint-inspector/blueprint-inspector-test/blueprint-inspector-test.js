/* <copyright>
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;
var TargetObject = require("../support/target-object").TargetObject;

exports.BlueprintInspectorTest = Montage.create(Component, {

    constructor: {
        value: function () {
            var self = this;
            this.super();
            self.object = TargetObject.create();
            self.object.blueprint.then(function(blueprint) {
                self.blueprint = blueprint;
                self.booleanPropertyBlueprint = blueprint.propertyBlueprintForName("booleanProperty");
                self.datePropertyBlueprint = blueprint.propertyBlueprintForName("dateProperty");
                self.enumPropertyBlueprint = blueprint.propertyBlueprintForName("enumProperty");
                self.numberPropertyBlueprint = blueprint.propertyBlueprintForName("numberProperty");
                self.objectPropertyBlueprint = blueprint.propertyBlueprintForName("objectProperty");
                self.stringPropertyBlueprint = blueprint.propertyBlueprintForName("stringProperty");
                self.urlPropertyBlueprint = blueprint.propertyBlueprintForName("urlProperty");
            }).done();
            return self;
        }
    },

    blueprintEditor: {
        value: null
    },

    booleanPropertyEditor: {
        value: null
    },

    datePropertyEditor: {
        value: null
    },

    enumPropertyEditor: {
        value: null
    },

    numberPropertyEditor: {
        value: null
    },

    objectPropertyEditor: {
        value: null
    },

    stringPropertyEditor: {
        value: null
    },

    urlPropertyEditor: {
        value: null
    },

    booleanPropertyBlueprint: {
        value: null
    },

    datePropertyBlueprint: {
        value: null
    },

    enumPropertyBlueprint: {
        value: null
    },

    numberPropertyBlueprint: {
        value: null
    },

    objectPropertyBlueprint: {
        value: null
    },

    stringPropertyBlueprint: {
        value: null
    },

    urlPropertyBlueprint: {
        value: null
    },

    object: {
        value: null
    },

    blueprint: {
        value: null
    }

});
