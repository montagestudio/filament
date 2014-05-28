/**
 @module "./map-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var Map = require("montage/collections/map"),
    ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./map-property-inspector.reel".MapPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.MapPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./map-property-inspector.reel".MapPropertyInspector# */ {

    constructor: {
        value: function MapPropertyInspector() {
            this.super();
            this.addPathChangeListener("propertyBlueprint", this, "_valueChanged");
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
            this.dispatchOwnPropertyChange("entries", this.entries);
        }
    },

    collectionValue: {
        get: function() {
            if (this.propertyBlueprint && this.propertyBlueprint.isToMany && (this.propertyBlueprint.collectionValueType === "map")) {
                if (this.objectValue) {
                    if (!(this.objectValue instanceof Map)) {
                        if (this.objectValue.forEach) {
                            this.objectValue = new Map(this.objectValue);
                        } else {
                            var temp = this.objectValue;
                            this.objectValue = new Map();
                            this.objectValue.set("", temp);
                        }
                    }
                }
                return this.objectValue;
            }
            return new Map();
        },
        set: function (value) {
            this.objectValue = value;
        }
    },

    entries: {
        get: function() {
            if (this.collectionValue) {
                return this.collectionValue.entries();
            }
            return [];
        }
    },

    _keyIndex: {
        value: 0
    },

    handleAddButtonAction: {
        value: function (evt) {
            if (!this.objectValue) {
                this.collectionValue = new Map();
            }
            this.dispatchBeforeOwnPropertyChange("entries", this.entries);
            this.collectionValue.set("key" + this._keyIndex, this.newObjectValue);
            this._keyIndex++;
            this.dispatchOwnPropertyChange("entries", this.entries);
        }
    },

    handleRemoveButtonAction: {
        value: function (evt) {
            var index = evt.detail.index;
            if (this.collectionValue && (index >= 0) && (index < this.collectionValue.length)) {
                this.dispatchBeforeOwnPropertyChange("entries", this.entries);
                this.collectionValue.delete(this.collectionValue.entries()[index][0]);
                this.dispatchOwnPropertyChange("entries", this.entries);
            }
        }
    }


});
