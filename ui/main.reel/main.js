var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    _environmentBridge: {
        value: null
    },

    environmentBridge: {
        get: function () {
            return this._environmentBridge;
        },
        set: function (value) {
            if (value === this._environmentBridge) {
                return;
            }

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidExitEnvironment(this);
            }

            this._environmentBridge = value;

            if (this._environmentBridge) {
                this._environmentBridge.mainComponentDidEnterEnvironment(this);
            }
        }
    },

    didCreate: {
        value: function () {

            var self = this;
            if (IS_IN_LUMIERES) {
                require.async("core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = exported.LumiereBridge.create();
                    self.awaitEditor();
                });
            } else {
                require.async("core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();
                    self.awaitEditor();
                });
            }
        }
    },

    awaitEditor: {
        value: function () {
            document.application.addEventListener("canLoadReel", this);
        }
    },

    handleCanLoadReel: {
        value: function () {

            var reelInfo = this.environmentBridge.reelUrlInfo,
                reelUrl = reelInfo.reelUrl,
                packageUrl = reelInfo.packageUrl;

            this.openComponent(reelUrl, packageUrl);
        }
    },

    openComponent: {
        value: function (reelUrl, packageUrl) {
            //TODO if we already have this reelUrl open, switch to it
            this.componentEditor.load(reelUrl, packageUrl);
        }
    }

});
