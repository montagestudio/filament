/**
 * @module ui/node-inspector.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class NodeInspector
 * @extends Component
 */
exports.NodeInspector = Component.specialize(/** @lends NodeInspector# */ {
    constructor: {
        value: function NodeInspector() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
