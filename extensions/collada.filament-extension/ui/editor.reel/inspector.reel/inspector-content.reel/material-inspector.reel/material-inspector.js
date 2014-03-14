/**
 * @module ui/material-inspector.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class MaterialInspector
 * @extends Component
 */
exports.MaterialInspector = Component.specialize(/** @lends MaterialInspector# */ {
    constructor: {
        value: function MaterialInspector() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
