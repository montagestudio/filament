var ReelVisitor = require("./reel-visitor").ReelVisitor;
var ProxySerializer = require("palette/core/serialization/proxy-serializer").ProxySerializer;

exports.ReelSerializer = ProxySerializer.specialize({

    constructor: {
        value: function ReelSerializer() {
            this.super();
        }
    },

    visitorConstructor: {
        value: ReelVisitor
    }

});
