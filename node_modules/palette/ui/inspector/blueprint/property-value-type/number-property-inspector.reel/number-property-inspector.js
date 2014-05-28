/**
 @module "./number-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./number-property-inspector.reel".NumberPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.NumberPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./number-property-inspector.reel".NumberPropertyInspector# */ {

    constructor: {
        value: function NumberPropertyInspector() {
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
