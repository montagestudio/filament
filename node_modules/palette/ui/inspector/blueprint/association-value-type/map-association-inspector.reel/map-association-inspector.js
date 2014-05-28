/**
    @module "./map-association-inspector.reel"
    @requires montage
 @requires "../../value-type-inspector.reel"
*/
var Map = require("montage/collections/map"),
    ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
    Description TODO
    @class module:"./map-association-inspector.reel".MapAssociationInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
*/
exports.MapAssociationInspector = ValueTypeInspector.specialize(/** @lends module:"./map-association-inspector.reel".MapAssociationInspector# */ {

    constructor: {
        value: function MapAssociationInspector() {
            this.super();
            this.addPathChangeListener("propertyBlueprint", this, "_valueChanged");
            this.addPathChangeListener("objectValue", this, "_valueChanged");
        }
    },

    draw: {
        value: function() {
            if (this.propertyBlueprint) {
                this.templateObjects.associationNameSubstitution.element.setAttribute("title", this.propertyBlueprint.name);
            }
        }
    },

    _valueChanged: {
        value: function() {
            this.dispatchOwnPropertyChange("collectionValue", this.collectionValue);
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
                            this.objectValue.add(temp);
                        }
                    }
                }
                return this.objectValue;
            }
            return new Map();
        },
        set: function(value) {
            this.objectValue = value;
        }
    },

    handleAddButtonAction: {
        value: function (evt) {
            if (!this.objectValue) {
                this.objectValue = new Map();
            }
            console.log("handleAddButtonAction");
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
