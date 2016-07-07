/**
    @module "./extension-panel.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./extension-panel.reel".ExtensionPanel
    @extends module:montage/ui/component.Component
*/
exports.ExtensionPanel = Component.specialize(/** @lends module:"./extension-panel.reel".ExtensionPanel# */ {

    extensionsController: {
        value: null
    }

});
