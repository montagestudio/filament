/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    templateObjects: {
        value: null
    },

    templateObjectsController: {
        value: null
    },

    didCreate: {
        value: function () {
            //TODO share an arraycontroller so selections are updated in sync with editingDocument
            this.templateObjectsController = ArrayController.create();
            Object.defineBinding(this.templateObjectsController, "content", {
                boundObject: this,
                boundObjectPropertyPath: "templateObjects",
                oneway: true
            });
        }
    }

});
