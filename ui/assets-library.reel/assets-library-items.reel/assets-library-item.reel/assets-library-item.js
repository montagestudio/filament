/**
 * @module ui/assets-library-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsLibraryItem
 * @extends Component
 */
exports.AssetsLibraryItem = Component.specialize(/** @lends AssetsLibraryItem# */ {

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, true);
            }
        }
    },

    projectUrl: {
        value: null
    },

    prototypeAsset: {
        value: null
    },

    _getRelativeUrl: {
        value: function () {
            if (this.projectUrl && this.prototypeAsset) {
                var length = this.projectUrl.length;

                if (this.projectUrl.charAt(length - 1) !== '/') {
                    length++;
                }

                return this.prototypeAsset.fileUrl.substring(length); // this.projectUrl + trailing slash.
            }
        }
    },

    captureDragstart: {
        value: function (event) {
            var dataTransfer = event.dataTransfer;

            if (dataTransfer) {
                dataTransfer.effectAllowed = "copyMove";
                dataTransfer.setData("text/plain", this.prototypeAsset.fileUrl);

                var iconElement = this.templateObjects.prototypeAssetIcon.element;

                dataTransfer.setDragImage(
                    iconElement,
                    iconElement.width / 2,
                    iconElement.height / 2
                );
            }
        }
    }

});
