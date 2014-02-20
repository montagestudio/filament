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

    fileInfo: {
        value: null
    },

    position: {
        value: null
    },

    projectController: {
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
            // FIXME: remove prompt
            var val = prompt("Directory name (" + this.fileInfo.filename + "):");
            this.projectController.environmentBridge.makeTree(this.fileInfo.fileUrl + val).done();
        }
    },

    handleDeleteButtonAction: {
        value: function (evt) {
            this.projectController.environmentBridge.removeTree(this.fileInfo.fileUrl).done();
        }
    }

});
