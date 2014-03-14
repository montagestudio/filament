/**
 * @module ui/inspector-bar.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class NodeInspectorBar
 * @extends Component
 */
exports.InspectorBar = Component.specialize(/** @lends InspectorBar# */ {

    constructor: {
        value: function InspectorBar() {
            this.super();
        }
    },

    items: {
        value: null
    }

});
