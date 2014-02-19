/**
 * @module ui/contextual-menu.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class ContextualMenu
 * @extends Component
 */
exports.ContextualMenu = Component.specialize(/** @lends ContextualMenu# */ {
    constructor: {
        value: function ContextualMenu() {
            this.super();
        }
    },

    position: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
        }
    },

    surrendersActiveTarget: {
        value: function () {
            this.dispatch("dismiss", true, false);
            return true;
        }
    },


    willPositionOverlay: {
        value: function (overlay, calculatedPosition) {
            return this.position;
        }
    },

    shouldDismissOverlay: {
        value: function (overlay, target, evt) {
            return true;
        }
    },

    handleCreateFolderButtonAction: {
        value: function (evt) {
            // FIXME: Do something
        }
    },

    handleDeleteButtonAction: {
        value: function (evt) {
            // FIXME: Do something
        }
    }

});
