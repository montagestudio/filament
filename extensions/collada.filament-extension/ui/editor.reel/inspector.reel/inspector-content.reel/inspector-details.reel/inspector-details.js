/**
 * @module ui/inspector-details.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class InspectorDetails
 * @extends Component
 */
exports.InspectorDetails = Component.specialize(/** @lends InspectorDetails# */ {

    constructor: {
        value: function InspectorDetails() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
