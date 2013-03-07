/* global lumieres */
var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    ExtensionController = require("core/extension-controller.js").ExtensionController,
    ViewController = require("core/view-controller.js").ViewController,
    PreviewController = require("core/preview-controller.js").PreviewController,
    ProjectController = require("core/project-controller.js").ProjectController,
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor,
    IS_IN_LUMIERES = (typeof lumieres !== "undefined");

var InnerTemplateInspector = require("contextual-inspectors/inner-template/core/controller");

exports.ApplicationDelegate = Montage.create(Montage, {

    detectEnvironmentBridge: {
        value: function () {
            var bridgePromise;

            if (IS_IN_LUMIERES) {
                bridgePromise = require.async("core/lumieres-bridge").then(function (exported) {
                    return exported.LumiereBridge.create();
                });
            } else {
                bridgePromise = require.async("core/browser-bridge").then(function (exported) {
                    return exported.BrowserBridge.create();
                });
            }

            return bridgePromise;
        }
    },

    application: {
        value: null
    },

    viewController: {
        value: null
    },

    projectController: {
        value: null
    },

    extensionController: {
        value: null
    },

    previewController: {
        value: null
    },

    environmentBridge: {
        value: null
    },

    _deferredApplication: {
        value: null
    },

    didCreate: {
        value: function () {
            // Make stack traces from promise errors easily available in the
            // console. Otherwise you need to manually inspect the error.stack
            // in the debugger.
            Promise.onerror = function (error) {
                if (error.stack) {
                    console.groupCollapsed("%c Uncaught promise rejection: " + (error.message || error), "color: #F00; font-weight: normal");
                    console.log(error.stack);
                    console.groupEnd();
                } else {
                    throw error;
                }
            };

            this._deferredApplication = Promise.defer();

            this.viewController = ViewController.create();
            this.viewController.registerEditorTypeForFileTypeMatcher(ComponentEditor, function (fileUrl) {
                return (/\.reel\/?$/).test(fileUrl);
            });

            this.viewController.registerContextualInspectorForObjectTypeMatcher(InnerTemplateInspector, function (object) {
                return object && object.moduleId && (/montage\/ui\/repetition\.reel/).test(object.moduleId);
            });

            this.previewController = PreviewController.create().init(this);

            var self = this,
                promisedApplication = this._deferredApplication.promise,
                promisedEnvironment,
                extensionController;

            promisedEnvironment = this.detectEnvironmentBridge().then(function (bridge) {
                self.environmentBridge = bridge;
                self.projectController = ProjectController.create().init(bridge, self.viewController);
                extensionController = self.extensionController = ExtensionController.create().init(self);

                return extensionController.loadExtensions();
            });

            Promise.all([promisedApplication, promisedEnvironment])
                .then(function() {
                    //TODO not activate all extensions by default
                    return Promise.all(extensionController.loadedExtensions.map(function (extension) {
                        return extensionController.activateExtension(extension);
                    }));
                }).then(function () {
                    var projectUrl = self.environmentBridge.projectUrl,
                        promisedProjectUrl;

                    // With extensions now loaded and activated, load a project
                    if (projectUrl) {
                        promisedProjectUrl = self.projectController.loadProject(projectUrl);
                    } else {
                        promisedProjectUrl = self.projectController.createApplication();
                    }

                    return promisedProjectUrl;
                }).then(function (projectUrl) {
                    self.projectController.setupMenuItems();

                    //TODO only do this if we have an index.html
                    return self.previewController.registerPreview(projectUrl, projectUrl + "/index.html").then(function () {
                        //TODO not launch the preview automatically?
                        return self.previewController.launchPreview();
                    });
                }).done();
        }
    },

    willFinishLoading: {
        value: function (app) {
            var self = this;
            this.application = app;

            //TODO sort out where many of these belong, more of the actual handling should probably be here

            window.addEventListener("didBecomeKey", function () {
                self.projectController.didBecomeKey();
            });

            window.addEventListener("didResignKey", function () {
                self.projectController.didResignKey();
            });

            window.addEventListener("openRelatedFile", function (evt) {
                var url = evt.detail;
                self.openFileUrl(url.replace("file://localhost/", "fs://localhost/").replace(/\/$/, "")).done();
            });

            window.addEventListener("beforeunload", function () {
                self.willClose();
            }, true);

            window.addEventListener("undo", function (evt) {
                //TODO stop the event here?
                evt.stopPropagation();
                evt.preventDefault();
                self.projectController.undo();
            }, true);

            window.addEventListener("redo", function (evt) {
                //TODO stop the event here?
                evt.stopPropagation();
                evt.preventDefault();
                self.projectController.redo();
            }, true);

            app.addEventListener("didSave", this);

            this._deferredApplication.resolve(app);
        }
    },

    willClose: {
        value: function () {
            //TODO only if we're registered
            this.previewController.unregisterPreview().done();
        }
    },

    handleDidSave: {
        value: function () {
            this.previewController.refreshPreview().done();
        }
    }
});
