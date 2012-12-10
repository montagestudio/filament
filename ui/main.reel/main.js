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
            var self = this;

            this.environmentBridge.projectInfo.then(function (projectInfo) {
                self.openProject(projectInfo);
            });
        }
    },

    packageUrl: {
        value: null
    },

    componentUrls: {
        value: null
    },

    // TODO define projectInfo contract
    openProject: {
        value: function (projectInfo) {
            var reelUrl = projectInfo.reelUrl,
                packageUrl = this.packageUrl = projectInfo.packageUrl;

            this.componentUrls = projectInfo.componentUrls;

            document.application.addEventListener("openComponent", this);

            if (reelUrl) {
                this.openComponent(reelUrl);
            }
        }
    },

    handleOpenComponent: {
        value: function (evt) {
            console.log("open component", evt.detail.componentUrl)
            this.openComponent("fs:/" + evt.detail.componentUrl);
        }
    },

    openComponent: {
        value: function (reelUrl) {
            //TODO if no packageUrl...well we shouldn't open a reel
            //TODO if we already have this reelUrl open, switch to it
            this.componentEditor.load(reelUrl, this.packageUrl);
        }
    }

});
