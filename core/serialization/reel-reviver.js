var Montage = require("montage").Montage,
    ProxyReviver = require("palette/core/serialization/proxy-reviver").ProxyReviver,
    ReelProxy = require("core/reel-proxy").ReelProxy;

exports.ReelReviver = Montage.create(ProxyReviver, {

    reviveMontageObject: {
        value: function(value, context, label) {

            if (context.hasUserObject(label)) {
                return context.getUserObject(label);
            }

            var exportId,
                proxyObject = ReelProxy.create(),
                revivedSerialization;

            context.setObjectLabel(proxyObject, label);
            revivedSerialization = this.reviveObjectLiteral(value, context);

            if ("owner" === label) {
                exportId = context.ownerExportId;
            }

            return proxyObject.init(label, revivedSerialization, exportId, context.editingDocument);
        }
    },

    // Stop MontageReviver from didReviveObjects
    didReviveObjects: {
        value: function(objects, context) {
        }
    }
});
