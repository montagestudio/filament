/**
    @module "./set-association-inspector.reel"
    @requires montage
 @requires "../../value-type-inspector.reel"
*/
var Set = require("montage/collections/set"),
    ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
    Description TODO
    @class module:"./set-association-inspector.reel".SetAssociationInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
*/
exports.SetAssociationInspector = ValueTypeInspector.specialize(/** @lends module:"./set-association-inspector.reel".SetAssociationInspector# */ {

    constructor: {
        value: function SetAssociationInspector() {
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
                this.objectValue = new Set();
            }
            this.collectionValue.add("");
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
