/**
 @module "./url-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./url-property-inspector.reel".UrlPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.UrlPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./url-property-inspector.reel".UrlPropertyInspector# */ {

    constructor: {
        value: function UrlPropertyInspector() {
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
