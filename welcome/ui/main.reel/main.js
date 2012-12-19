var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    didCreate: {
        value: function () {

            var self = this;
            if (IS_IN_LUMIERES) {
                this.version = lumieres.version;
                require.async("core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = exported.LumiereBridge.create();
                });
            } else {
                require.async("core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();
                });
            }
        }
    },

    //TODO not show ui until we have an environment bridge
    //This would be a good case of the whole "custom loading scenario" idea
    environmentBridge: {
        value: null
    }
});
