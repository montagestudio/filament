/**
    @module "./binding-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./binding-entry.reel".BindingEntry
    @extends module:montage/ui/component.Component
*/
exports.BindingEntry = Montage.create(Component, /** @lends module:"./binding-entry.reel".BindingEntry# */ {

    binding: {
        value: null
    }

});
