var ProxyContext = require("palette/core/serialization/proxy-context").ProxyContext;

exports.BlueprintContext = ProxyContext.specialize({

    constructor: {
        value: function BlueprintContext() {
            this.super();
        }
    }

});
