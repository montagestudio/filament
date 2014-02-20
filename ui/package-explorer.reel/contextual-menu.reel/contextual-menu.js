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

    _fileCell: {
        value: null
    },

    fileCell: {
        get: function () {
            return this._fileCell;
        },
        set: function (value) {
            if (this._fileCell === value) { return; }

            if (this._fileCell) {
                this._fileCell.classList.remove("contextualMenu-selection"); // FIXME: THIS IS GROSS, MUCH GROSS
            }
            this._fileCell = value;
            if (this._fileCell) {
                this._fileCell.classList.add("contextualMenu-selection"); // FIXME: THIS IS GROSS, WOW SUCH GROSS
            }
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
            this.fileCell = null;
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
            this.fileCell = null;
            this.dispatchEventNamed("dismiss", true, false);
        }
    },

    handleDeleteButtonAction: {
        value: function (evt) {
            this.projectController.environmentBridge.removeTree(this.fileInfo.fileUrl).done();
            this.fileCell = null;
            this.dispatchEventNamed("dismiss", true, false);
        }
    }

});
