/**
 * @module ui/node-details.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class NodeDetails
 * @extends Component
 */
exports.NodeDetails = Component.specialize(/** @lends NodeDetails# */ {

    constructor: {
        value: function NodeDetails() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
