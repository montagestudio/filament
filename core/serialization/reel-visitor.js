var Montage = require("montage").Montage,
    MontageVisitor = require("montage/core/serialization/serializer/montage-visitor").MontageVisitor;

exports.ReelVisitor = Montage.create(MontageVisitor, {

    getTypeOf: {
        value: function (object) {
            if ("stageObject" in object) {
                return "ProxyObject";
            } else {
                return MontageVisitor.getTypeOf.call(this, object);
            }
        }
    },

    visitProxyObject: {
        value: function(malker, proxyObject, name) {
            if (this.isObjectSerialized(proxyObject)) {
                this.serializeReferenceToProxyObject(malker, proxyObject, name);
            } else {
                this.handleProxyObject(malker, proxyObject, name);
            }
        }
    },

    serializeReferenceToProxyObject: {
        value: function (malker, object, name) {
            var label = object.label,
                reference = this.builder.createObjectReference(label);

            this.builder.top.setProperty(name, reference);
        }
    },

    handleProxyObject: {
        value: function (malker, proxyObject, name) {
            var builderObject = this.builder.createCustomObject();

            this.setObjectSerialization(proxyObject, builderObject);

            this.serializeProxyObject(malker, proxyObject, builderObject);

            builderObject.setLabel(proxyObject.label);
            this.builder.top.setProperty(name, builderObject);
        }
    },

    serializeProxyObject: {
        value: function(malker, proxyObject, builderObject) {
            var propertiesBuilderObject = this.builder.createObjectLiteral();

            this.setObjectType(proxyObject, builderObject);
            builderObject.setProperty("properties", propertiesBuilderObject);

            this.builder.push(builderObject);

            this.setObjectProperties(malker, proxyObject);
            this.setObjectCustomUnits(malker, proxyObject);
            builderObject.setProperty("prototype", proxyObject.exportId);

            this.builder.pop();

            // Remove the properties unit in case none was serialized,
            // we need to add it before any other units to make sure that
            // it's the first unit to show up in the serialization, since we
            // don't have a way to order the property names in a serialization.
            if (propertiesBuilderObject.getPropertyNames().length === 0) {
                builderObject.clearProperty("properties");
            }
        }
    },

    setObjectProperties: {
        value: function(malker, object) {
            var propertiesSerializer,
                propertiesObject;

            propertiesObject = this.builder.top.getProperty("properties");

            this.builder.push(propertiesObject);
            this.setSerializableObjectProperties(malker, object);
            this.builder.pop();
        }
    },

    setSerializableObjectProperties: {
        value: function(malker, object) {
            var type,
                propertyName,
                propertyNames = object.properties.keys(),
                propertyNamesCount = propertyNames.length;

            for (var i = 0; i < propertyNamesCount; i++) {
                propertyName = propertyNames[i];
                this.setProperty(malker, propertyName, object.getObjectProperty(propertyName));
            }
        }
    },

    setObjectCustomUnit: {
        value: function(malker, object, unitName) {
            var value;

            if ("bindings" === unitName) {
                value = this.serializeBindingProxies(object.bindings);

            } else if ("listeners" === unitName) {
                value = this.serializeListenerProxies(object.listeners);
            }

            if (value != null) {
                malker.visit(value, unitName);
            }
        }
    },

    serializeListenerProxies: {
        value: function (listeners) {
            var outputs = [];
            var hasListeners;

            listeners.forEach(function (value) {
                var output = {};
                output.type = value.type;
                output.useCapture = value.useCapture;
                output.listener = {"@": value.listener.label};

                outputs.push(output);
                hasListeners = true;
            });

            return hasListeners ? outputs : undefined;
        }
    },

    serializeBindingProxies: {
        value: function (bindings) {
            var outputs = {};
            var hasBindings;

            bindings.forEach(function (value) {
                var output = {};
                var sourcePath = value.sourcePath;

                if (value.twoWay) {
                    output["<->"] = sourcePath;
                } else {
                    output["<-"] = sourcePath;
                }

                //TODO support converters

                if (value.trace) {
                    output.trace = true;
                }

                outputs[value.targetPath] = output;
                hasBindings = true;
            });

            return hasBindings ? outputs : undefined;
        }
    },
    setObjectType: {
        value: function(object, builderObject) {
            var exportId = object.getObjectProperty("prototype"),
                objectId = object.getObjectProperty("object");

            if (exportId) {
                builderObject.setProperty("prototype", exportId);
            } else if (objectId) {
                builderObject.setProperty("object", objectId);
            }
        }
    }

});
