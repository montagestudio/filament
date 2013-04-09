var Montage = require("montage").Montage,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    ReelProxy = require("core/reel-proxy").ReelProxy,
    Map = require("montage/collections/map"),
    List = require("montage/collections/list");

exports.ReelReviver = Montage.create(MontageReviver, {

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
