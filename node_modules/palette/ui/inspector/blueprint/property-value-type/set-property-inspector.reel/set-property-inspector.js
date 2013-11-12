/**
 @module "./set-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var Set = require("montage/collections/set"),
    ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./set-property-inspector.reel".SetPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.SetPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./set-property-inspector.reel".SetPropertyInspector# */ {

    constructor: {
        value: function SetPropertyInspector() {
            this.super();
            this.addPathChangeListener("propertyBlueprint", this, "_valueChanged");
            this.addPathChangeListener("objectValue", this, "_valueChanged");
        }
    },

    _valueChanged: {
        value: function() {
            this.dispatchOwnPropertyChange("collectionValue", this.collectionValue);
        }
    },

    collectionValue: {
        get: function () {
            if (this.propertyBlueprint && this.propertyBlueprint.isToMany && (this.propertyBlueprint.collectionValueType === "set")) {
                if (this.objectValue) {
                    if (!(this.objectValue instanceof Set)) {
                        if (this.objectValue.forEach) {
                            this.objectValue = new Set(this.objectValue);
                        } else {
                            var temp = this.objectValue;
                            this.objectValue = new Set();
                            this.objectValue.add(temp);
                        }
                    }
                }
                return this.objectValue;
            }
            return new Set();
        },
        set: function (value) {
            this.objectValue = value;
        }
    },

    handleAddButtonAction: {
        value: function (evt) {
            if (!this.objectValue) {
                this.collectionValue = new Set();
            }
            this.collectionValue.add(this.newObjectValue);
        }
    },

    handleRemoveButtonAction: {
        value: function (evt) {
            var index = evt.detail.index;
            if (this.collectionValue && (index >= 0) && (index < this.collectionValue.length)) {
                this.collectionValue.splice(index, 1);
            }
        }
    }



});
