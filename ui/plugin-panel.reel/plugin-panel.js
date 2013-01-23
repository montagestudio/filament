/**
    @module "./plugin-panel.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./plugin-panel.reel".PluginPanel
    @extends module:montage/ui/component.Component
*/
exports.PluginPanel = Montage.create(Component, /** @lends module:"./plugin-panel.reel".PluginPanel# */ {

    pluginsController: {
        value: null
    }

});
