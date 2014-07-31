/**
    @module "./property-entry.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component,
    BindingValue = require("../../values/binding-value.reel").BindingValue,
    StringValue = require("../../values/string-value.reel").StringValue,
    BooleanValue = require("../../values/boolean-value.reel").BooleanValue,
    ObjectValue = require("../../values/object-value.reel").ObjectValue,
    ArrayValue = require("../../values/array-value.reel").ArrayValue,
    NumberValue = require("../../values/number-value.reel").NumberValue;

/**
    Description TODO
    @class module:"./property-entry.reel".PropertyEntry
    @extends module:montage/ui/component.Component
*/
exports.PropertyEntry = Component.specialize(/** @lends module:"./property-entry.reel".PropertyEntry# */ {

    constructor: {
        value: function PropertyEntry() {
            this._typeToValueEditorComponent = {};
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this._element.addEventListener("dragstart", this, false);
                this.addEventListener("changePropertyType", this, false);
                this.addEventListener("updatePropertyValue", this, false);
                this.addEventListener("didChangeMode", this, false);
                this.addPathChangeListener("property.type", this, "handlePropertyTypeChange");
            }
        }
    },

    property: {
        value: null
    },

    // The same as property.blueprint.valueType but is "array" when cardinality
    // is Infinity.
    _valueType: {
        value: null
    },

    _updatePropertyValue: {
        value: function(value) {
            var editingDocument = this.property.templateObject._editingDocument;

            if (this._isBinding(this.property.type)) {
                editingDocument.updateOwnedObjectBinding(
                    this.property.templateObject,
                    this.property.value,
                    this.property.value.targetPath,
                    this.property.value.oneway,
                    value).done();
            } else {
                editingDocument.setOwnedObjectProperty(this.property.templateObject,
                    this.property.blueprint.name, value);
            }
        }
    },

    _isBinding: {
        value: function(propertyType) {
            return propertyType === "one-way-binding" ||
                propertyType === "two-way-binding";
        }
    },

    _typeToValueEditorComponent: {
        value: null
    },

    //jshint -W074
    _getValueEditorComponent: {
        value: function(propertyType) {
            var valueType = this.property.blueprint.valueType;
            var cardinality = this.property.blueprint.cardinality;
            var isBinding = this._isBinding(propertyType);
            var component;
            var componentType;

            // We don't know how to handle arrays of different types of objects
            // so consider it a generic array.
            if (cardinality === Number.POSITIVE_INFINITY) {
                valueType = "array";
            }
            if (valueType === "url") {
                valueType = "string";
            }
            this._valueType = valueType;

            // The component that edits objects and arrays is also able to
            // edit bindings.
            if (isBinding && valueType !== "object" && valueType !== "array") {
                componentType = "binding";
            } else {
                componentType = valueType;
            }

            component = this._typeToValueEditorComponent[componentType];
            if (component) {
                // Cancel previsouly set binding before re-using component
                component.cancelBinding("value");
                if (component.getBinding("editingDocument")) {
                    component.cancelBinding("editingDocument");
                }
            } else {
                if (componentType === "object") {
                    component = new ObjectValue();
                } else if (componentType === "array") {
                    component = new ArrayValue();
                } else if (componentType === "binding") {
                    component = new BindingValue();
                } else if (componentType === "string") {
                    component = new StringValue();
                } else if (componentType === "boolean") {
                    component = new BooleanValue();
                } else if (componentType === "number") {
                    component = new NumberValue();
                } else {
                    console.log("unknown type: ", componentType);
                    return;
                }
            }

            // Set specific properties of the ObjectValue/ArrayValue
            if (componentType === "object" || componentType === "array") {
                if (isBinding) {
                    component.mode = "binding";
                } else {
                    // Let the component figure it out
                    component.mode = null;
                }
                component.objectsMap = this.property.templateObject._editingDocument.editingProxyMap;
            }

            if (isBinding) {
                component.defineBinding("value", {
                    "<-": "property.value.sourcePath",
                    source: this
                });
                component.defineBinding("editingDocument", {
                    "<-": "property.templateObject._editingDocument",
                    source: this
                });
            } else {
                component.defineBinding("value", {
                    "<-": "property.value",
                    source: this
                });
            }

            this._typeToValueEditorComponent[componentType] = component;

            return component;
        }
    },
    //jshint +W074
    didReceiveReference: {
        value: function(outlet, label) {
            var proxyMap = this.property.templateObject._editingDocument.editingProxyMap;
            var object = proxyMap[label];

            this._updatePropertyValue(object);
        }
    },

    handleChangePropertyType: {
        value: function(event) {
            var type = this.property.type;
            var newType = event.detail.type;
            var editingDocument = this.property.templateObject._editingDocument;

            if (newType === type) {
                return;
            }

            if (newType === "assignment") {
                this._propertyBindingValue = this.templateObjects.propertyValue.content.value;
                editingDocument.replaceOwnedObjectBindingWithProperty(
                    this.property.templateObject,
                    this.property.value,
                    null);
            } else {
                if (type === "assignment") {
                    editingDocument.replaceOwnedObjectPropertyWithBinding(
                        this.property.templateObject,
                        this.property.blueprint.name,
                        newType === "one-way-binding", /* oneway */
                        this._propertyBindingValue || "");
                } else {
                    editingDocument.updateOwnedObjectBinding(
                        this.property.templateObject,
                        this.property.value,
                        this.property.value.targetPath,
                        newType === "one-way-binding", /* oneway */
                        this.property.value.sourcePath).done();
                }
            }
        }
    },

    handleUpdatePropertyValue: {
        value: function(event) {
            // Ignore this event when the PropertyEditor doesn't have a
            // property. Can happen when switching between properties.
            if (!this.property) {
                return;
            }

            var value = event.detail.value;
            this._updatePropertyValue(value);
        }
    },

    handlePropertyTypeChange: {
        value: function(propertyType) {
            if (!propertyType) {
                return;
            }

            var slot = this.templateObjects.propertyValue;
            var component = this._getValueEditorComponent(propertyType);

            if (slot.content !== component) {
                slot.content = component;
            }
        }
    },

    handleRemoveButtonAction: {
        value: function() {
            this.dispatchEventNamed("removeProperty", true, false, {
                propertyName: this.property.blueprint.name
            });
        }
    }

});
