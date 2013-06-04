var BlueprintVisitor = require("./blueprint-visitor").BlueprintVisitor;
var ProxySerializer = require("palette/core/serialization/proxy-serializer").ProxySerializer;

exports.BlueprintSerializer = ProxySerializer.specialize({

    constructor: {
        value: function BlueprintSerializer() {
            this.super();
        }
    },

    visitorConstructor: {
        value: BlueprintVisitor
    }

});
