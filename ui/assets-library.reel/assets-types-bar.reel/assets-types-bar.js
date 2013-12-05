/**
 * @module ui/assets-types-bar.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsTypesBar
 * @extends Component
 */
exports.AssetsTypesBar = Component.specialize(/** @lends AssetsTypesBar# */ {
    constructor: {
        value: function AssetsTypesBar() {
            this.super();
        }
    },

    assetTypes: {
        value: null
    },

    selectedAssetType: {
        value: null
    },

    toolBarController: {
        value: null
    }

});
