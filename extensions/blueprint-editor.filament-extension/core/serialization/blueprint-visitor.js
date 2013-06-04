var ProxyVisitor = require("palette/core/serialization/proxy-visitor").ProxyVisitor;

exports.BlueprintVisitor = ProxyVisitor.specialize({

    constructor: {
        value: function BlueprintVisitor() {
            this.super();
        }
    }

});
