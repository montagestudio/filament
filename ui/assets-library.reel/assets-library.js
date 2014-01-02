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
                this.addOwnPropertyChangeListener("selectedAssetCategory", this);
                this.assetCategories = Object.keys(this.assetsManager.assetCategories);

                if (this.assetCategories.length > 0) {
                    this.templateObjects.assetsCategoriesBar.toolBarController.select(this.assetCategories[0]);
                }
            }
        }
    },

    assetCategories: {
        value: null
    },

    selectedAssetCategory: {
        value: null
    },

    assetsManager: {
        value: null
    },

    content: {
        value: null
    },

    selectAssetsListByCategory: {
        value: function (assetCategory) {
            this.content = this.assetsManager.getAssetsByAssetCategory(assetCategory);
        }
    },

    handleSelectedAssetCategoryChange: {
        value: function (selectedAssetCategory) {
            this.selectAssetsListByCategory(selectedAssetCategory);
        }
    }

});
