/**
    @module "ui/template-object-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/template-object-cell.reel".TemplateObjectCell
    @extends module:montage/ui/component.Component
*/
exports.TemplateObjectCell = Montage.create(Component, /** @lends module:"ui/template-object-cell.reel".TemplateObjectCell# */ {

    templateObject: {
        value: null
    }

});
