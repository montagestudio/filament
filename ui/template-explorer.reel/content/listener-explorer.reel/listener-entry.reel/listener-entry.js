/**
    @module "./listener-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./listener-entry.reel".ListenerEntry
    @extends module:montage/ui/component.Component
*/
exports.ListenerEntry = Montage.create(Component, /** @lends module:"./listener-entry.reel".ListenerEntry# */ {

    listenerInfo: {
        value: null
    }

});
