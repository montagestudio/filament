/**
    @module "./extension-panel.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./extension-panel.reel".ExtensionPanel
    @extends module:montage/ui/component.Component
*/
exports.ExtensionPanel = Montage.create(Component, /** @lends module:"./extension-panel.reel".ExtensionPanel# */ {

    extensionsController: {
        value: null
    }

});
