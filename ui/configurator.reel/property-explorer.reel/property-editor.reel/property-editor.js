/**
 * @module "ui/inspector/blueprint/property-editor.reel"
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component

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
            this.addBeforeOwnPropertyChangeListener("model", this.handleModelWillChange.bind(this));
        }
    },

    isLabelReadOnly: {
        value: false
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

    // TODO: This property basically implements the logic of a substitution.
    // The key difference is that it loads components on the fly rather than
    // during deserialization. We don't want every inspector to be loaded into
    // memory at all times because even when inspectors are not in the DOM
    // their bindings will still be triggered, which causes some faulty logic.
    // -Corentin
    _propertyType: {
        get: function () {
            return this.__propertyType;
        },
        set: function (value) {
            var self = this;
            if (this.__propertyType === value) {
                return;
            }
            this.__propertyType = value;

            // Yeah, I know...
            switch (value) {
                case "binding":
                    return require.async("palette/ui/inspector/blueprint/bound-property-editor.reel")
                        .then(function (module) {
                            var editor = new module.BoundPropertyEditor();
                            editor.readOnlyLabel = true;
                            editor.defineBinding("binding", {"<-": "model", source: self});
                            editor.defineBinding("label", {"<-": "model.key", source: self});
                            editor.defineBinding("object", {"<-": "model.targetObject", source: self});
                            self.inspector = editor;
                        });
                case "object-association":
                    return require.async("palette/ui/inspector/blueprint/association-value-type/object-association-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.ObjectAssociationInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "list-association":
                    return require.async("palette/ui/inspector/blueprint/association-value-type/list-association-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.ListAssociationInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "set-association":
                    return require.async("palette/ui/inspector/blueprint/association-value-type/set-association-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.SetAssociationInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "map-association":
                    return require.async("palette/ui/inspector/blueprint/association-value-type/map-association-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.MapAssociationInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "boolean-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/boolean-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.BooleanPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "date-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/date-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.DatePropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "enum-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/enum-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.EnumPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "number-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/number-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.NumberPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "object-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/object-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.ObjectPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "string-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/string-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.StringPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "url-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/url-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.UrlPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "list-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/list-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.ListPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "set-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/set-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.SetPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "map-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/map-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.MapPropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                case "resource-property":
                    return require.async("palette/ui/inspector/blueprint/property-value-type/resource-property-inspector.reel")
                        .then(function (module) {
                            var inspector = new module.ResourcePropertyInspector();
                            self._configureInspector(inspector);
                            self.inspector = inspector;
                        });
                default:
                    this.inspector = void 0;
                    break;
            }
        }
    },

    /**
     * Helper to define standard values and bindings on property inspectors and
     * association inspectors.
     *
     * @private
     */
    _configureInspector: {
        value: function (inspector) {
            inspector.readOnlyLabel = true;
            inspector.defineBinding("editingDocument", {"<-": "editingDocument", source: this});
            inspector.defineBinding("label", {"<-": "model.key", source: this});
            inspector.defineBinding("objectValue", {"<->": "model.value", source: this});
            inspector.defineBinding("propertyBlueprint", {"<-": "model.propertyDescriptor", source: this});
        }
    },

    model: {
        get: function () {
            return this._model;
        },
        set: function (value) {
            if (this._model !== value) {
                this._model = value;
            }
        }
    },

    handleModelWillChange: {
        value: function () {
            this._propertyType = void 0;
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
            this.model && this.model.value !== void 0 && this.model.value !== null && this.model.commit();
        }
    },

    handlePress: {
        value: function (evt) {
            var isTargetingName = evt.targetElement === this.readOnlyPropertyName.element ||
                evt.targetElement === this.readWritePropertyName.element;
            if (isTargetingName && this.isInCustomizableGroup) {
                this.dispatchEventNamed("addProperty", true, false, {
                    propertyModel: this.model
                });
            }
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
    },

    handleResetToDefaultButtonAction: {
        value: function () {
            this.model.resetToDefault();
        }
    }
});
