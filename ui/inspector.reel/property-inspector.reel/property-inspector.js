/**
 * @module ui/inspector.reel//property-inspector.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PropertyInspector
 * @extends Component
 */
exports.PropertyInspector = Component.specialize(/** @lends PropertyInspector# */ {

    showInstanceProperties: {
        value: true
    },

    showDefaultProperties: {
        value: true
    }
});
