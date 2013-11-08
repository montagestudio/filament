/**
 * @module ui/drawer.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Drawer
 * @extends Component
 */
exports.Drawer = Component.specialize(/** @lends Drawer# */ {
    constructor: {
        value: function Drawer() {
            this.super();
        }
    },

    isOpen: {
        value: false
    }
});
