/**
    @module "./blueprint-object-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./blueprint-object-cell.reel".BlueprintObjectCell
    @extends module:montage/ui/component.Component
*/
exports.BlueprintObjectCell = Montage.create(Component, /** @lends module:"./blueprint-object-cell.reel".BlueprintObjectCell# */ {

    zoom: {
        value: 1
    },

    editingDocument: {
        value: null
    },

    blueprintObjectProxy: {
        value: null
    }

});
