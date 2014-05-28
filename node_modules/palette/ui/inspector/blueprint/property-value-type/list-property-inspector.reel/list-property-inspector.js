/**
 @module "./list-property-inspector.reel"
 @requires montage
 @requires "../../value-type-inspector.reel"
 */
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
 Description TODO
 @class module:"./list-property-inspector.reel".ListPropertyInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
 */
exports.ListPropertyInspector = ValueTypeInspector.specialize(/** @lends module:"./list-property-inspector.reel".ListPropertyInspector# */ {

    constructor: {
        value: function ListPropertyInspector() {
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
            this.dispatchOwnPropertyChange("collectionValue", this.collectionValue);
        }
    },

    //jshint -W009
    collectionValue: {
        get: function () {
            if (this.propertyBlueprint && this.propertyBlueprint.isToMany && (this.propertyBlueprint.collectionValueType === "list")) {
                if (this.objectValue) {
                    if (!(this.objectValue instanceof Array)) {
                        if (this.objectValue.forEach) {
                            this.objectValue = new Array(this.objectValue);
                        } else {
                            var temp = this.objectValue;
                            this.objectValue = new Array();
                            this.objectValue.add(temp);
                        }
                    }
                }
                return this.objectValue;
            }
            return new Array();
        },
        set: function (value) {
            this.objectValue = value;
        }
    },

    handleAddButtonAction: {
        value: function (evt) {
            if (!this.objectValue) {
                this.collectionValue = new Array();
                // The collectionValue property is basically a wrapper around the
                // objectValue, this is why we need to manually dispatch a
                // collectionValue change, otherwise the observers will not now
                // that this property has changed as a consequence.
                // this.dispatchOwnPropertyChange("collectionValue", this.objectValue);
            }
            this.collectionValue.add(this.newObjectValue);
        }
    },
    //jshint +W009

    handleRemoveButtonAction: {
        value: function (evt) {
            var index = evt.detail.index;
            if (this.collectionValue && (index >= 0) && (index < this.collectionValue.length)) {
                this.collectionValue.splice(index, 1);
            }
        }
    }


});
