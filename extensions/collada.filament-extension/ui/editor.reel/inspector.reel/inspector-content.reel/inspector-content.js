/**
 * @module ui/inspector-content.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class InspectorContent
 * @extends Component
 */
exports.InspectorContent = Component.specialize(/** @lends InspectorContent# */ {

    constructor: {
        value: function InspectorContent() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
