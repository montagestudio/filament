var ProxyReviver = require("palette/core/serialization/proxy-reviver").ProxyReviver,
    BlueprintObjectProxy = require("../blueprint-object-proxy").BlueprintObjectProxy;

exports.BlueprintReviver = ProxyReviver.specialize({

    constructor: {
        value: function BlueprintReviver() {
            this.super();
        }
    },

    rootObjectLabel: {
        value: "root"
    },

    proxyConstructor: {
        value: BlueprintObjectProxy
    },

    // Stop MontageReviver from didReviveObjects
    didReviveObjects: {
        value: function(objects, context) {
        }
    }
});
