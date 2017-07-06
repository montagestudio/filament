/**
 * @module "ui/inspector/blueprint/property-editor.reel"
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Gate = require("montage/core/gate").Gate;

/**
 * An editor for a single property on an editing proxy. Displays an appropriate
 * editor for the property's type (if the target object has an ObjectDescriptor),
 * and displays a binding inspector if needed, as well as buttons for creating/
 * reverting bindings.
 * @class PropertyEditor
 * @extends module:montage/ui/component.Component
 */
exports.PropertyEditor = Component.specialize(/** @lends PropertyEditor# */ {

    constructor: {
        value: function PropertyEditor () {
            this.super();

            this.addPathChangeListener("model.isBound", this, "handlePropertyTypeDependencyChange");
            this.addPathChangeListener("model.propertyDescriptor.isAssociationBlueprint", this, "handlePropertyTypeDependencyChange");
            this.addPathChangeListener("model.propertyDescriptor.isToMany", this, "handlePropertyTypeDependencyChange");
            this.addPathChangeListener("model.propertyDescriptor.collectionValueType", this, "handlePropertyTypeDependencyChange");
            this.addPathChangeListener("model.propertyDescriptor.valueType", this, "handlePropertyTypeDependencyChange");
            this.addPathChangeListener("model.value", this, "handleValueChange");
        }
    },

    enterDocument: {
        value: function (firstTime) {
            var self = this;
            if (firstTime) {
                this.element.addEventListener("mouseenter", function () {
                    self.classList.add("mouseOver");
                });
                this.element.addEventListener("mouseleave", function () {
                    self.classList.remove("mouseOver");
                });
            }
        }
    },

    _propertyType: {
        value: null
    },

    model: {
        get: function () {
            return this._model;
        },
        set: function (value) {
            this._model = value;
        }
    },

    handlePropertyTypeDependencyChange: {
        value: function() {
            var descriptor;
            if (!this.model) {
                return;
            }

            if (this.model.isBound) {
                this._propertyType = "binding";
            } else if ((descriptor = this.model.propertyDescriptor)) {
                if (descriptor.isAssociationBlueprint) {
                    this._propertyType = (descriptor.isToMany ? descriptor.collectionValueType : "object") + "-association";
                } else {
                    this._propertyType = (descriptor.isToMany ? descriptor.collectionValueType : descriptor.valueType) + "-property";
                }
            } else {
                // TODO: Could do something smarter here, infer the type from the value
                this._propertyType = "string-property";
            }
        }
    },

    handleValueChange: {
        value: function () {
            // TODO: This commits the model after every value change, should
            // probably improve this to only commit when the editing field
            // loses focus.
            // - Corentin
            this.model && this.model.commit();
        }
    },

    handleDefineBindingButtonAction: {
        value: function () {
            this.model.isBound = true;
            this.dispatchEventNamed("addBinding", true, false, {
                bindingModel: this.model
            });
        }
    },

    handleCancelBindingButtonAction: {
        value: function () {
            this.model.isBound = false;
            this.model.commit();
        }
    },

    handleDeleteButtonAction: {
        value: function () {
            this.model.delete();
        }
    }
});
