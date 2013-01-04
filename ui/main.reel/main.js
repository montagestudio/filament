var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise,
    ProjectController = require("core/project-controller.js").ProjectController;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    componentEditor: {
        value: null
    },

    projectController: {
        value: null
    },

    libraryItems: {
        value: null
    },

    components: {
        value: null
    },

    _bridgePromise: {
        value: null
    },

    didCreate: {
        value: function () {
            if (IS_IN_LUMIERES) {
                this._bridgePromise = require.async("core/lumieres-bridge").then(function (exported) {
                    return Promise.resolve(exported.LumiereBridge.create());
                });
            } else {
                this._bridgePromise = require.async("core/browser-bridge").then(function (exported) {
                    return Promise.resolve(exported.BrowserBridge.create());
                });
            }
        }
    },

    prepareForDraw: {
        value: function () {

            var self = this;

            this._bridgePromise.then(function (environmentBridge) {
                self.projectController = ProjectController.create().initWithEnvironmentBridgeAndComponentEditor(environmentBridge, self.componentEditor);
                self.projectController.addEventListener("canLoadProject", self, false);
                self.projectController.addEventListener("didOpenPackage", self, false);

                //TODO I'm not sure if the project controller should just observe this itself
                window.addEventListener("didBecomeKey", function () {
                    self.projectController.didBecomeKey();
                });

                window.addEventListener("didResignKey", function () {
                    self.projectController.didResignKey();
                });

            }).done();
        }
    },

    handleCanLoadProject: {
        enumerable: false,
        value: function () {
            var projectUrl = this.projectController.projectUrl;

            if (projectUrl) {
                this.projectController.loadProject(projectUrl);
            } else {
                this.projectController.createApplication();
            }
        }
    },

    handleDidOpenPackage: {
        value: function (evt) {
            this.addPropertyChangeListener("windowTitle", this, false);

            document.addEventListener("save", this, false);

            var app = document.application;
            app.addEventListener("openComponent", this);
            app.addEventListener("addFile", this);
            app.addEventListener("installDependencies", this);

            Object.defineBinding(this, "libraryItems", {
                boundObject: this.projectController,
                boundObjectPropertyPath: "libraryItems",
                oneway: true
            });

            Object.defineBinding(this, "components", {
                boundObject: this.projectController,
                boundObjectPropertyPath: "components",
                oneway: true
            });

            // Update title
            // TODO this should be unnecessary as the packageUrl has been changed...
            this.needsDraw = true;
        }
    },

    handleOpenComponent: {
        value: function (evt) {
            this.projectController.openComponent("fs:/" + evt.detail.componentUrl);
        }
    },

    handleAddFile: {
        value: function (evt) {
            //TODO don't call addComponent until we know it's a component we want
            this.projectController.createComponent();
        }
    },

    handleInstallDependencies: {
        value: function () {
            this.projectController.installDependencies();
        }
    },

    handleSave: {
        value: function (evt) {
            this.projectController.save(evt.detail.url);
        }
    },


    handleChange: {
        value: function (notification) {
            if ("windowTitle" === notification.currentPropertyPath) {
                this.needsDraw = true;
            }
        }
    },

    windowTitle: {
        dependencies: ["packageUrl", "projectController.currentDocument.title"],
        get: function () {

            var projectTitle,
                packageUrl = this.projectController ? this.projectController.packageUrl : null,
                currentDocument = this.projectController ? this.projectController.currentDocument : null;

            if (packageUrl) {
                projectTitle = packageUrl.substring(packageUrl.lastIndexOf("/") + 1);
            }

            if (currentDocument) {
                projectTitle = currentDocument + " — " + projectTitle;
            }

            return projectTitle;
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
