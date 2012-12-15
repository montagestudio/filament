var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Promise = require("montage/core/promise").Promise;

exports.BrowserBridge = Montage.create(EnvironmentBridge, {

    projectInfo: {
        get: function () {
            return Promise.resolve({"reelUrl": require.getPackage({name: "palette"}).location + "templates/component.reel"});
        }
    }

});
