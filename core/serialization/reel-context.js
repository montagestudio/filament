var ProxyContext = require("palette/core/serialization/proxy-context").ProxyContext;

exports.ReelContext = ProxyContext.specialize({

    constructor: {
        value: function ReelContext() {
            this.super();
        }
    },

    getElementById: {
        value: function (id) {
            var element = this.editingDocument.htmlDocument.querySelector("[data-montage-id='" + id + "']");
            return element ? this.editingDocument.nodeProxyForNode(element) : null;
        }
    }

});
