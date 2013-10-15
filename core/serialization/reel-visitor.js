var ProxyVisitor = require("palette/core/serialization/proxy-visitor").ProxyVisitor;
var BUILDER_UNIT_LABEL = "_dev";

exports.ReelVisitor = ProxyVisitor.specialize({

    constructor: {
        value: function ReelVisitor() {
            this.super();
        }
    },


    visitNodeProxy: {
        value: function (malker, nodeProxy, name) {
            malker.visit(nodeProxy._templateNode, name);
        }
    },

    setObjectCustomUnit: {
        value: function (malker, object, unitName) {
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

    serializeProxyObject: {
        value: function (malker, proxyObject, builderObject) {
            this.super(malker, proxyObject, builderObject);

            var metadataProperties = proxyObject.editorMetadata;

            if (metadataProperties.keys().length) {
                var metadataSerializationObject = {};

                metadataProperties.forEach(function (value, key) {
                    metadataSerializationObject[key] = value;
                });

                builderObject.setProperty(BUILDER_UNIT_LABEL, metadataSerializationObject);
            } else {
                builderObject.clearProperty(BUILDER_UNIT_LABEL);
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

            bindings.forEach(function (binding) {
                var output = {};
                var sourcePath = binding.sourcePath;
                var converterObject = binding.converterObject;

                if (!binding.oneway) {
                    output["<->"] = sourcePath;
                } else {
                    output["<-"] = sourcePath;
                }

                if (converterObject) {
                    output.converter = {
                        "@": converterObject
                    };
                }

                if (binding.trace) {
                    output.trace = true;
                }

                outputs[binding.targetPath] = output;
                hasBindings = true;
            });

            return hasBindings ? outputs : undefined;
        }
    }

});
