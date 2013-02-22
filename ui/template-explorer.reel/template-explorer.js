/**
    @module "./template-explorer.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./template-explorer.reel".TemplateExplorer
    @extends module:montage/ui/component.Component
*/
exports.TemplateExplorer = Montage.create(Component, /** @lends module:"./template-explorer.reel".TemplateExplorer# */ {

    templatesObjects: {
        value: null
    },

    selectedObjects: {
        value: null
    },

    templatesObjectsController: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            // semi-HACK to unselect other objects
            // FIXME when the repetition support single selection
            this.templateObjects.templateObjectList.element.addEventListener("mouseup", this, true);
        }
    },

    captureMouseup: {
        value: function (event) {
            this.selectedObjects.clear();
        }
    }

});
