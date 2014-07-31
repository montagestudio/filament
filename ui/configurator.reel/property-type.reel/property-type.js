/**
 * @module ui/property-type.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PropertyType
 * @extends Component
 */
var PropertyType = exports.PropertyType = Component.specialize(/** @lends PropertyType# */ {
    constructor: {
        value: function PropertyType() {
            this.super();
        }
    },

    value: {
        value: "assignment"
    },

    handlePress: {
        value: function(event) {
            var ix = PropertyType.TYPES.indexOf(this.value);
            var value = PropertyType.TYPES[++ix % PropertyType.TYPES.length];

            this.dispatchEventNamed("changePropertyType", true, false, {
                type: value
            });
        }
    }
}, {
    TYPES: {
        value: ["assignment", "one-way-binding", "two-way-binding"]
    }
});
