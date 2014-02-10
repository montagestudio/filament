var Set = require("montage/collections/set"),
    Map = require("montage/collections/map"),
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Promise = require("montage/core/promise").Promise,
    EditingProxy = require("../editing-proxy").EditingProxy;

exports.ProxyReviver = MontageReviver.specialize({

    constructor: {
        value: function ProxyReviver() {
            this.super();
        }
    },

    getTypeOf: {
        value: function(value) {
            if (
                typeof value === "object" &&
                value !== null
            ) {
                if (value.type === "map") {
                    return "Map";
                } else if (value.type === "set") {
                    return "Set";
                }
            }

            return this.super(value);
        }
    },

    reviveMap: {
        value: function(value, context, label) {
            var map = new Map(value.entries);

            if (label) {
                context.setObjectLabel(map, label);
            }

            return map;
        }
    },

    reviveSet: {
        value: function(value, context, label) {
            var map = new Set(value.values);

            if (label) {
                context.setObjectLabel(map, label);
            }

            return map;
        }
    },

    /*
     * Revive a montage proxied object.<br/>
     * <b>Note:</b> This need to be overwritten to make something useful
     */
    reviveMontageObject: {
        value: function (value, context, label) {

            if (context.hasUserObject(label)) {
                return context.getUserObject(label);
            }

            var proxyObject = new this.proxyConstructor(),
                self = this,
                revivedSerialization;

            context.setObjectLabel(proxyObject, label);
            revivedSerialization = this.reviveObjectLiteral(value, context);

            if (Promise.isPromise(revivedSerialization)) {
                return revivedSerialization.then(function (revivedSerialization) {
                    return self._initProxy(proxyObject, label, context, revivedSerialization);
                });
            } else {
                return self._initProxy(proxyObject, label, context, revivedSerialization);
            }
        }
    },

    _initProxy: {
        value: function (proxyObject, label, context, serialization) {

            var exportId;

            if (this.rootObjectLabel === label) {
                exportId = context.ownerExportId;
            } else {
                exportId = serialization.prototype || serialization.object;
            }

            return proxyObject.init(label, serialization, exportId, context.editingDocument);
        }
    },

    rootObjectLabel: {
        value: "root"
    },

    proxyConstructor: {
        value: EditingProxy
    },

    // Stop MontageReviver from didReviveObjects
    didReviveObjects: {
        value: function (objects, context) {
        }
    }
});
