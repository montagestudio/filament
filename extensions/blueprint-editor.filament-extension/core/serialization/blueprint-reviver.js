var Montage = require("montage").Montage,
    ProxyReviver = require("palette/core/serialization/proxy-reviver").ProxyReviver,
    BlueprintObjectProxy = require("../blueprint-object-proxy").BlueprintObjectProxy;

exports.BlueprintReviver = Montage.create(ProxyReviver, {

    reviveMontageObject: {
        value: function(value, context, label) {

            if (context.hasUserObject(label)) {
                return context.getUserObject(label);
            }

            var exportId,
                proxyObject = BlueprintObjectProxy.create(),
                revivedSerialization;

            context.setObjectLabel(proxyObject, label);
            revivedSerialization = this.reviveObjectLiteral(value, context);

            if ("root" === label) {
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
