/**
 * @module ui/inspector-template.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class InspectorTemplate
 * @extends Component
 */
exports.InspectorTemplate = Component.specialize(/** @lends InspectorTemplate# */ {

    constructor: {
        value: function InspectorTemplate() {
            this.super();
        }
    },

    inspector: {
        value: null
    }

});
