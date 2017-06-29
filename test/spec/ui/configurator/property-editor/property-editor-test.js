/* <copyright>
 </copyright> */
var Component = require("montage/ui/component").Component,
    TargetObject = require("./target-object").TargetObject,
    EditingProxy = require("palette/core/editing-proxy").EditingProxy,
    PropertyModel = require("filament/core/property-model").PropertyModel;

exports.PropertyEditorTest = Component.specialize({

    constructor: {
        value: function () {
            var self = this,
                object = new TargetObject();
            this.super();
            this.proxy = new EditingProxy().init("target", {
                "prototype": "spec/ui/configurator.reel/property-editor/target-object",
                "bindings": {
                    "propertyB": {"<-": "'abc'"},
                    "customPropertyB": {"<-": "'def'"},
                    "complex.binding": {"<-": "'ghi'"}
                }
            }, "spec/ui/configurator.reel/property-editor/target-object", {
                setOwnedObjectProperty: function (proxy, property, value) {
                    proxy.setObjectProperty(property, value);
                },
                deleteOwnedObjectProperty: function (proxy, property) {
                    proxy.deleteObjectProperty(property);
                },
                cancelOwnedObjectBinding: function (proxy, binding) {
                    proxy.cancelObjectBinding(binding);
                }
            });
            object.blueprint.then(function (blueprint) {
                self.propertyA = new PropertyModel(self.proxy, blueprint, "propertyA");
                self.propertyB = new PropertyModel(self.proxy, blueprint, "propertyB");
                self.customPropertyA = new PropertyModel(self.proxy, blueprint, "customPropertyA");
                self.customPropertyB = new PropertyModel(self.proxy, blueprint, "customPropertyB");
                self.complexBinding = new PropertyModel(self.proxy, blueprint, "complex.binding");
            });
            return this;
        }
    },

    // Editors

    propertyEditor: {
        value: null
    },

    boundPropertyEditor: {
        value: null
    },

    customPropertyEditor: {
        value: null
    },

    boundCustomPropertyEditor: {
        value: null
    },

    complexBindingEditor: {
        value: null
    },

    // Models

    proxy: {
        value: null
    },

    propertyA: {
        value: null
    },

    propertyB: {
        value: null
    },

    customPropertyA: {
        value: null
    },

    customPropertyB: {
        value: null
    },

    complexBinding: {
        value: null
    }

});
