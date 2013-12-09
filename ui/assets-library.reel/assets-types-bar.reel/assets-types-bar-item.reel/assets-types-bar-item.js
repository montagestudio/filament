/**
 * @module ui/assets-types-bar-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsTypesBarItem
 * @extends Component
 */
exports.AssetsTypesBarItem = Component.specialize(/** @lends AssetsTypesBarItem# */ {

    constructor: {
        value: function AssetsTypesBarItem() {
            this.super();
        }
    },

    assetTypeName: {
        value: null
    }

});
