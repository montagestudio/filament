/**
 @module "./boolean-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./boolean-property-inspector.reel".BooleanPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.BooleanPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./boolean-property-inspector.reel".BooleanPropertyInspector# */ {

    constructor: {
        value: function BooleanPropertyInspector() {
            this.super();
            this.addPathChangeListener("objectValue", this, "_valueChanged");
        }
    },

    draw: {
        value: function() {
            if (this.propertyBlueprint) {
                this.templateObjects.propertyNameSubstitution.element.setAttribute("title", this.propertyBlueprint.name);
            }
        }
    },

    _valueChanged: {
        value: function() {
            this.dispatchOwnPropertyChange("booleanValue", this.booleanValue);
        }
    },

    booleanValue: {
        get: function() {
            return !! this.objectValue;
        },
        set: function(value) {
            if (value) {
                this.objectValue = true;
            } else if (this.objectValue) {
                this.objectValue = false;
            }
        }
    }

});
