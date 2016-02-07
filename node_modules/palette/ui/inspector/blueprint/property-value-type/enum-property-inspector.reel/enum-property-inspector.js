/**
 @module "./enum-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./enum-property-inspector.reel".EnumPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.EnumPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./enum-property-inspector.reel".EnumPropertyInspector# */ {

    constructor: {
        value: function EnumPropertyInspector() {
            this.super();
        }
    },

    _hasValueBeenInitialized: {
        value: false
    },

    objectValue: {
        get: function() {
            return Object.getPropertyDescriptor(ValueTypeInspector.prototype, "objectValue").get.call(this);
        },
        set: function(value) {
            // The first valid value we get is the default and should not be serialized
            if (this._hasValueBeenInitialized) {
                Object.getPropertyDescriptor(ValueTypeInspector.prototype, "objectValue").set.apply(this, arguments);
            } else {
                this._fakeUpdateValue(value);
            }
        }
    },

    _fakeUpdateValue: {
        value: function(value) {
            if (typeof value !== "undefined" && value !== null) {
                this._hasValueBeenInitialized = true;
            }
            Object.getPropertyDescriptor(ValueTypeInspector.prototype, "objectValue").set.call(this, void 0);
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
