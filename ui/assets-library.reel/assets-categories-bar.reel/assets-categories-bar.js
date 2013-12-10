/**
 * @module ui/assets-categories-bar.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsCategoriesBar
 * @extends Component
 */
exports.AssetsCategoriesBar = Component.specialize(/** @lends AssetsCategoriesBar# */ {
    constructor: {
        value: function AssetsCategoriesBar() {
            this.super();
        }
    },

    assetCategories: {
        value: null
    },

    selectedAssetCategory: {
        value: null
    },

    toolBarController: {
        value: null
    }

});
