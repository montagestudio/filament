var Promise = require("montage/core/promise").Promise,
    ProxyReviver = require("palette/core/serialization/proxy-reviver").ProxyReviver,
    ReelProxy = require("core/reel-proxy").ReelProxy;

exports.ReelReviver = ProxyReviver.specialize({

    constructor: {
        value: function ReelReviver() {
            this.super();
        }
    },

    rootObjectLabel: {
        value: "owner"
    },

    proxyConstructor: {
        value: ReelProxy
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
        value: function (objects, context) {
        }
    }
});
