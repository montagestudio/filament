/**
 * @module ui/material-details.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class MaterialDetails
 * @extends Component
 */
exports.MaterialDetails = Component.specialize(/** @lends MaterialDetails# */ {

    constructor: {
        value: function MaterialDetails() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
