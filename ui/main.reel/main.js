var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ComponentInfo = require("core/component-info.js").ComponentInfo;

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

    components: {
        value: null
    },

    // TODO define projectInfo contract
    openProject: {
        value: function (projectInfo) {
            var reelUrl = projectInfo.reelUrl,
                app = document.application;

            this.packageUrl = projectInfo.packageUrl;

            this.components = projectInfo.componentUrls.map(function (url) {
                return ComponentInfo.create().initWithUrl(url);
            });

            this.addPropertyChangeListener("windowTitle", this, false);
            app.addEventListener("openComponent", this);
            app.addEventListener("addFile", this);

            if (reelUrl) {
                this.openComponent(reelUrl);
            }

            // Update title
            // TODO this should be unnecessary as the packageUrl has been changed...
            this.needsDraw = true;
        }
    },

    handleOpenComponent: {
        value: function (evt) {
            console.log("open component", evt.detail.componentUrl);
            this.openComponent("fs:/" + evt.detail.componentUrl);
        }
    },

    openComponent: {
        value: function (reelUrl) {
            var self = this;
            //TODO if no packageUrl...well we shouldn't open a reel
            //TODO if we already have this reelUrl open, switch to it
            this.componentEditor.load(reelUrl, this.packageUrl).then(function (editingDocument) {
                self.currentDocument = editingDocument;
            });

        }
    },

    currentDocument: {
        value: null
    },

    windowTitle: {
        dependencies: ["packageUrl", "currentDocument.title"],
        get: function () {

            var projectTitle;

            if (this.packageUrl) {
                projectTitle = this.packageUrl.substring(this.packageUrl.lastIndexOf("/") + 1);
            }

            if (this.currentDocument) {
                projectTitle = this.currentDocument.title + " — " + projectTitle;
            }

            return projectTitle;
        }
    },

    handleAddFile: {
        value: function (evt) {
            //TODO present new file dialog
            console.log("main: add new file");
        }
    },

    handleChange: {
        value: function (notification) {
            if ("windowTitle" === notification.currentPropertyPath) {
                this.needsDraw = true;
            }
        }
    },

    draw: {
        value: function () {
            if (this.windowTitle) {
                document.title = this.windowTitle;
            }
        }
    }

});
