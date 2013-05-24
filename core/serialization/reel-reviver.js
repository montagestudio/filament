var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
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

            if (Promise.isPromise(revivedSerialization)) {
                return revivedSerialization.then(function (revivedSerialization) {
                    return proxyObject.init(label, revivedSerialization, exportId, context.editingDocument);
                });
            } else {
                return proxyObject.init(label, revivedSerialization, exportId, context.editingDocument);
            }
        }
    },

    // We want to be forgiving if an element can't be found, so that the
    // user can add one later
    reviveElement: {
        value: function () {
            var el = ProxyReviver.reviveElement.apply(this, arguments);

            if (Promise.isPromise(el) && el.isRejected()) {
                return void 0;
            }

            return el;
        }
    },

    // Stop MontageReviver from didReviveObjects
    didReviveObjects: {
        value: function(objects, context) {
        }
    }
});
