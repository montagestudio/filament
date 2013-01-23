/**
    @module "./plugin-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./plugin-cell.reel".PluginCell
    @extends module:montage/ui/component.Component
*/
exports.PluginCell = Montage.create(Component, /** @lends module:"./plugin-cell.reel".PluginCell# */ {

    plugin: {
        value: null
    },

    handleActivationButtonAction: {
        value: function () {
            this.dispatchEventNamed("activatePlugin", true, true, this.plugin);
        }
    },

    handleDeactivationButtonAction: {
        value: function () {
            this.dispatchEventNamed("deactivatePlugin", true, true, this.plugin);
        }
    }

});
