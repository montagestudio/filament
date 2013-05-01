var Montage = require("montage").Montage,
    ProxyVisitor = require("palette/core/serialization/proxy-visitor").ProxyVisitor;

exports.ReelVisitor = Montage.create(ProxyVisitor, {

    visitNodeProxy: {
        value: function(malker, nodeProxy, name) {
            malker.visit(nodeProxy._templateNode, name);
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

            bindings.forEach(function (binding) {
                var output = {};
                var sourcePath = binding.sourcePath;

                if (!binding.oneway) {
                    output["<->"] = sourcePath;
                } else {
                    output["<-"] = sourcePath;
                }

                //TODO support converters

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
