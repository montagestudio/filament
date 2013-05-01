var Montage = require("montage").Montage,
    ProxyContext = require("palette/core/serialization/proxy-context").ProxyContext;

exports.ReelContext = Montage.create(ProxyContext, {

    getElementById: {
        value: function(id) {
            var element = this.editingDocument.htmlDocument.querySelector("[data-montage-id='" + id + "']");
            return element ? this.editingDocument.nodeProxyForNode(element) : null;
        }
    }

});
