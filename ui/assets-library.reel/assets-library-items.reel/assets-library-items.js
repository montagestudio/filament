/**
 * @module ui/assets-library-items.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class AssetsLibraryItems
 * @extends Component
 */
exports.AssetsLibraryItems = Component.specialize(/** @lends AssetsLibraryItems# */ {

    constructor: {
        value: function AssetsLibraryItems() {
            this.super();
        }
    },

    assetsManager: {
        value: null
    }

});
