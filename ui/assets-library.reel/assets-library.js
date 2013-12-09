/**
 * @module ui/assets-library.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsLibrary
 * @extends Component
 */
exports.AssetsLibrary = Component.specialize(/** @lends AssetsLibrary# */ {

    constructor: {
        value: function AssetsLibrary() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addOwnPropertyChangeListener("selectedAssetType", this);
                this.assetTypes = Object.keys(this.assetsManager.assetTypes);

                if (this.assetTypes.length > 0) {
                    this.templateObjects.assetsTypesBar.toolBarController.select(this.assetTypes[0]);
                }
            }
        }
    },

    assetTypes: {
        value: null
    },

    selectedAssetType: {
        value: null
    },

    assetsManager: {
        value: null
    },

    content: {
        value: null
    },

    selectAssetsListByType: {
        value: function (assetType) {
            this.content = this.assetsManager.getAssetsByAssetType(assetType);
        }
    },

    handleSelectedAssetTypeChange: {
        value: function (assetTypeSelected) {
            this.selectAssetsListByType(assetTypeSelected);
        }
    }

});
