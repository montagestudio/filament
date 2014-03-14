/**
 * @module ui/inspector-bar-item.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class NodeInspectorBarItem
 * @extends Component
 */
exports.InspectorBarItem = Component.specialize(/** @lends InspectorBarItem# */ {

    constructor: {
        value: function InspectorBarItem() {
            this.super();
        }
    },

    label: {
        value: null
    }

});
