/**
    @module "./extension-cell.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"./extension-cell.reel".ExtensionCell
    @extends module:montage/ui/component.Component
*/
exports.ExtensionCell = Component.specialize(/** @lends module:"./extension-cell.reel".ExtensionCell# */ {

    extension: {
        value: null
    },

    handleActivationButtonAction: {
        value: function () {
            this.dispatchEventNamed("activateExtension", true, true, this.extension);
        }
    },

    handleDeactivationButtonAction: {
        value: function () {
            this.dispatchEventNamed("deactivateExtension", true, true, this.extension);
        }
    }

});
