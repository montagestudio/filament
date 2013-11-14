/* global lumieres */
var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    ExtensionController = require("core/extension-controller").ExtensionController,
    ViewController = require("core/view-controller").ViewController,
    PreviewController = require("core/preview-controller").PreviewController,
    ProjectController = require("core/project-controller").ProjectController,
    ReelDocument = require("core/reel-document").ReelDocument,
    IS_IN_LUMIERES = (typeof lumieres !== "undefined");

var InnerTemplateInspector = require("contextual-inspectors/inner-template/ui/inner-template-inspector.reel").InnerTemplateInspector;

exports.ApplicationDelegate = Montage.create(Montage, {

    detectEnvironmentBridge: {
        value: function () {
            var bridgePromise;

            if (IS_IN_LUMIERES) {
                bridgePromise = require.async("adaptor/client/core/lumieres-bridge").then(function (exported) {
                    return new exported.LumiereBridge().init("filament-backend");
                });
            } else {
                bridgePromise = require.async("adaptor/client/core/environment-bridge").then(function (exported) {
                    return new exported.EnvironmentBridge().init("filament-backend");
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

    _deferredMainComponent: {
        value: null
    },

    constructor: {
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
            this._deferredMainComponent = Promise.defer();

            this.viewController = ViewController.create();

            this.viewController.registerContextualInspectorForObjectTypeMatcher(InnerTemplateInspector, function (object) {
                return (
                    object &&
                    object.moduleId &&
                    (/montage\/ui\/repetition\.reel/).test(object.moduleId)
                );
            });
            this.viewController.registerContextualInspectorForObjectTypeMatcher(InnerTemplateInspector, function (object) {
                return (
                    object &&
                    object.stageObject &&
                    object.stageObject._template &&
                    object.stageObject._template.hasParameters() &&
                    // HACK: Don't show the inner template inspector for the
                    // flow because it interupts the modal editor
                    !(
                        object.moduleId ||
                        (/montage\/ui\/flow\.reel/).test(object.moduleId)
                    )
                );
            });

            this.previewController = (new PreviewController()).init(this);

            var self = this,
                promisedApplication = this._deferredApplication.promise,
                promisedMainComponent = this._deferredMainComponent.promise,
                promisedBridge = this.detectEnvironmentBridge(),
                promisedLoadedExtensions,
                extensionController;

            promisedLoadedExtensions = Promise.all([promisedApplication, promisedBridge])
                .spread(function (app, bridge) {
                    self.application = app;
                    self.environmentBridge = bridge;

                    extensionController = self.extensionController = ExtensionController.create().init(self);
                    return extensionController.loadExtensions();

                }, function(error) {
                    //TODO improve handling if the application or the environment are rejected
                    console.log("Cannot load the extensions ", error);
                    return [];
                });

            Promise.all([promisedMainComponent, promisedLoadedExtensions])
                .spread(function (mainComponent, loadedExtensions) {
                    self.projectController = ProjectController.create().init(self.environmentBridge, self.viewController, mainComponent, extensionController);

                    self.projectController.registerUrlMatcherForDocumentType(function (fileUrl) {
                        return (/\.reel\/?$/).test(fileUrl);
                    }, ReelDocument);

                    // Ensure that the currentEditor is considered the nextTarget before the application
                    //TODO should probably be the document
                    mainComponent.defineBinding("nextTarget", {"<-": "projectController.currentEditor", source: self});

                    //TODO not activate all extensions by default
                    return Promise.all(extensionController.loadedExtensions.map(function (extension) {
                        return extensionController.activateExtension(extension);
                    }));
                }).then(function (activatedExtensions) {
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
                    //TODO only do this if we have an index.html
                    return self.previewController.registerPreview(projectUrl, projectUrl + "/index.html").then(function () {
                        //TODO not launch the preview automatically?
                        return self.previewController.launchPreview();
                    });
                }).done();
        }
    },

    handleComponentLoaded: {
        value: function (evt) {
            this._deferredMainComponent.resolve(evt.detail);
        }
    },

    willFinishLoading: {
        value: function (app) {
            var self = this;

            //TODO sort out where many of these belong, more of the actual handling should probably be here

            window.addEventListener("openRelatedFile", function (evt) {
                var url = evt.detail;
                // FIXME: this method does not exist
                self.openFileUrl(url.replace("file://localhost/", "fs://localhost/")).done();
            });

            window.addEventListener("beforeunload", function () {
                self.willClose();
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
