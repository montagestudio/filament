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

    selectedFileCell: {
        value: null
    },

    show: {
        value: function (fileInfo, position) {
            this.fileInfo = fileInfo;
            this.position = position;
            this.templateObjects.contextualMenuOverlay.show();
        }
    },

    enterDocument: {
        value: function (firstTime) {
        }
    },

    surrendersActiveTarget: {
        value: function () {
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
            this.fileInfo = null;
            return true;
        }
    },

    _getParentPath: {
        value: function (fullPath, filename) {
            return fullPath.slice(0, fullPath.lastIndexOf(filename));
        }
    },

    handleCreateFolderButtonAction: {
        value: function (evt) {
            var file = this.fileInfo,
                filename = file.name,
                fullPath = file.fileUrl,
                value = prompt("Folder name:"), // FIXME: replace prompt with overlay
                path = (file.isDirectory)? fullPath : this._getParentPath(fullPath, filename);
            if (value) {
                this.projectController.environmentBridge.makeTree(path + value).done();
            }
            this.fileInfo = null;
            this.templateObjects.contextualMenuOverlay.hide();
        }
    },

    handleDeleteButtonAction: {
        value: function (evt) {
            this.projectController.environmentBridge.removeTree(this.fileInfo.fileUrl).done();
            this.fileInfo = null;
            this.templateObjects.contextualMenuOverlay.hide();
        }
    }

});
