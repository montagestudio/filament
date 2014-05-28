/**
 @module "./string-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./string-property-inspector.reel".StringPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.StringPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./string-property-inspector.reel".StringPropertyInspector# */ {

    constructor: {
        value: function StringPropertyInspector() {
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
