var EnvironmentBridge = require("adaptor/client/core/environment-bridge").EnvironmentBridge,
    Promise = require("montage/core/promise").Promise;

exports.BrowserBridge = EnvironmentBridge.specialize({

    constructor: {
        value: function BrowserBridge() {
            this.super();
        }
    },

    projectInfo: {
        get: function () {
            return Promise.resolve({"fileUrl": require.getPackage({name: "palette"}).location + "templates/component.reel"});
        }
    }

});
