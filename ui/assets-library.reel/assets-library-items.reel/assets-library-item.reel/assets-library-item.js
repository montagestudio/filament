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

    prototypeAsset: {
        value: null
    },

    assetsManager: {
        value: null
    },

    captureDragstart: {
        value: function (event) {
            if (this.assetsManager) {
                var relativeUrl = this.assetsManager.getRelativePathWithAssetFromCurrentReelDocument(this.prototypeAsset);

                if (relativeUrl) {
                    var dataTransfer = event.dataTransfer;

                    if (dataTransfer) {
                        dataTransfer.effectAllowed = "copyMove";

                        if (this.prototypeAsset.isGlTFBundle()) {
                            relativeUrl = relativeUrl.replace(/\/?$/, ''); // remove hypothetical last trailling character.
                            relativeUrl = relativeUrl + '/' + this.prototypeAsset.name + ".json";
                            // Fixme: Does not work if the json file inside the bundle
                            // doesn't have the same name of the GlTF bundle.
                        }

                        dataTransfer.setData("text/plain", relativeUrl);

                        var iconElement = this.templateObjects.prototypeAssetIcon.element;

                        dataTransfer.setDragImage(
                            iconElement,
                            iconElement.width / 2,
                            iconElement.height / 2
                        );
                    }
                }
            }
        }
    }

});
