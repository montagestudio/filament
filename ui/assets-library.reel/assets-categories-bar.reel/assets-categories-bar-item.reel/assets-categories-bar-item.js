/**
 * @module ui/assets-categories-bar-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsCategoriesBarItem
 * @extends Component
 */
exports.AssetsCategoriesBarItem = Component.specialize(/** @lends AssetsCategoriesBarItem# */ {

    constructor: {
        value: function AssetsCategoriesBarItem() {
            this.super();
        }
    },

    assetCategoryName: {
        value: null
    }

});
