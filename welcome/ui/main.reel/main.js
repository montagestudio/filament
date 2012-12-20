var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    HistoryItemConverter = require("welcome/core/history-item-converter").HistoryItemConverter;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    recentDocuments: {
        value: null
    },

    didCreate: {
        value: function () {

            var self = this;
            if (IS_IN_LUMIERES) {
                this.version = lumieres.version;

                Object.defineBinding(this, "recentDocuments", {
                    boundObject: lumieres,
                    boundObjectPropertyPath: "recentDocuments",
                    oneway: true
                });

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
    },

    handleOpenDocument: {
        value: function (evt) {
            this.environmentBridge.open(evt.detail.url);
        }
    },

    handleNewAppButtonAction: {
        value: function () {
            var envBridge = this.environmentBridge;
            envBridge.newApplication()
                .then(function (applicationUrl) {
                    envBridge.open(applicationUrl);
                }, function (fail) {
                    throw new Error("Could not create new application");
                }).done();
        }
    }

});
