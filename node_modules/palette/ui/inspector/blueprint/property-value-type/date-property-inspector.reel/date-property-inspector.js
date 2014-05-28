/**
 @module "./date-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./date-property-inspector.reel".DatePropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.DatePropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./date-property-inspector.reel".DatePropertyInspector# */ {

    constructor: {
        value: function DatePropertyInspector() {
            this.super();
        }
    },

    draw: {
        value: function() {
            if (this.propertyBlueprint) {
                this.templateObjects.propertyNameSubstitution.element.setAttribute("title", this.propertyBlueprint.name);
            }
        }
    }
});
