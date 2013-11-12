/**
    @module "./object-association-inspector.reel"
    @requires montage
 @requires "../../value-type-inspector.reel"
*/
var ValueTypeInspector = require("../../value-type-inspector.reel").ValueTypeInspector;

/**
    Description TODO
    @class module:"./object-association-inspector.reel".ObjectAssociationInspector
 @extends module:"../../value-type-inspector.reel".ValueTypeInspector
*/
exports.ObjectAssociationInspector = ValueTypeInspector.specialize(/** @lends module:"./object-association-inspector.reel".ObjectAssociationInspector# */ {

    constructor: {
        value: function ObjectAssociationInspector() {
            this.super();
            this.addPathChangeListener("propertyBlueprint", this, "_valueChanged");
            this.addPathChangeListener("objectValue", this, "_valueChanged");
        }
    },

    _valueChanged: {
        value: function() {
            this.dispatchOwnPropertyChange("objectReferenceValue", this.objectReferenceValue);
        }
    },

    objectReferenceValue: {
        get: function () {
            if (this.propertyBlueprint && this.objectValue && (this.propertyBlueprint.valueType === "object")) {
                return "@" + this.objectValue.label;
            }
            return this.objectValue;
        },
        set: function (value) {
            if (typeof value === "string" && this.editingDocument) {
                if (value[0] === "@") {
                    var label = value.substring(1);
                    var target = this.editingDocument.editingProxyMap[label];
                    console.log("setting target ", target);
                    if (target) {
                        this.objectValue = target;
                    }
                } else if (value.length === 0) {
                    this.objectValue = null;
                }
            }
        }
    }

});
