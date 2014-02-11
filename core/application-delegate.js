var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    ExtensionController = require("core/extension-controller").ExtensionController,
    ViewController = require("core/view-controller").ViewController,
    PreviewController = require("core/preview-controller").PreviewController,
    ProjectController = require("core/project-controller").ProjectController,
    ReelDocument = require("core/reel-document").ReelDocument,
    FilamentService = require("core/filament-service").FilamentService;

var InnerTemplateInspector = require("contextual-inspectors/inner-template/ui/inner-template-inspector.reel").InnerTemplateInspector;

exports.ApplicationDelegate = Montage.create(Montage, {

    _bridgePromise: {
        value: null
    },

    getEnvironmentBridge: {
        value: function () {
            var bridgePromise = this._bridgePromise;

            if (!bridgePromise) {
                bridgePromise = require.async("adaptor/client/core/environment-bridge").then(function (exported) {
                    return new exported.EnvironmentBridge().init("filament-backend", new FilamentService());
                });
                this._bridgePromise = bridgePromise;
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
                promisedBridge = this.getEnvironmentBridge(),
                extensionController,
                loadedExtensions,
                projectController;

            Promise.all([promisedApplication, promisedBridge, promisedMainComponent])
                .spread(function (app, bridge, mainComponent) {
                    self.application = app;
                    self.environmentBridge = bridge;

                    if (typeof bridge.setEnableFileDrop === "function") {
                        bridge.setEnableFileDrop(true);
                    }

                    extensionController = self.extensionController = ExtensionController.create().init(self);

                    //TODO move this elsewhere, maybe rename to specifically reflect the stage of bootstrapping
                    return self.didLoadEnvironmentBridge().then(function () {
                        return bridge.mainMenu;
                    }).then(function(mainMenu) {
                        app.mainMenu = mainMenu;
                    }).then(function () {
                        // Give subclasses a way to interject before proceeding to load the project
                        return self.willLoadProject();
                    }).then(function () {
                        return extensionController.loadExtensions().fail(function (error) {
                            console.log("Failed loading extensions, proceeding with none");
                            return [];
                        }).then(function(extensions) {
                            loadedExtensions = extensions;
                        });
                    }).then(function () {
                        projectController = self.projectController = ProjectController.create().init(self.environmentBridge, self.viewController, mainComponent, extensionController, self.previewController);

                        projectController.registerUrlMatcherForDocumentType(function (fileUrl) {
                            return (/\.reel\/?$/).test(fileUrl);
                        }, ReelDocument);

                        // Ensure that the currentEditor is considered the nextTarget before the application
                        //TODO should probably be the document
                        mainComponent.defineBinding("nextTarget", {"<-": "projectController.currentEditor", source: self});

                        //TODO not activate all extensions by default
                        return Promise.all(loadedExtensions.map(function (extension) {
                            return extensionController.activateExtension(extension);
                        }));
                    }).then(function () {
                        return bridge.projectUrl;
                    }).then(function (projectUrl) {
                        var promisedProjectUrl;

                        // With extensions now loaded and activated, load a project
                        if (projectUrl) {
                            promisedProjectUrl = projectController.loadProject(projectUrl);
                        } else {
                            promisedProjectUrl = projectController.createApplication();
                        }

                        return promisedProjectUrl;
                    }).then(function (projectUrl) {
                        //TODO only do this if we have an index.html
                        return self.previewController.registerPreview(projectUrl, projectUrl + "/index.html").then(function () {
                            //TODO not launch the preview automatically?
                            return self.previewController.launchPreview();
                        });
                    }).then(function () {
                        return self.didLoadProject();
                    });

                }, function(error) {
                    console.error("Failed loading application");
                    return error;
                }).done();
        }
    },

    /**
     * Template method available for subclasses to implement their own logic
     * as soon as an environment bridge is available
     *
     * @return {Promise} A promise to continue
     */
    didLoadEnvironmentBridge: {
        value: function () {
            return Promise.resolve();
        }
    },

    /**
     * Template method available for subclasses to implement their own logic
     * ahead of loading the project as directed by the environment.
     *
     * @return {Promise} A promise to continue the loading sequence
     */
    willLoadProject: {
        value: function () {
            return Promise.resolve();
        }
    },

    /**
     * Template method available for subclasses to implement their own logic
     * after a project has been loaded as directed by the environment
     *
     * @return {Promise} A promise to continue
     */
    didLoadProject: {
        value: function () {
            return Promise.resolve();
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
            app.addEventListener("didChangeObjectProperties", this);
            app.addEventListener("didSetObjectBinding", this);
            app.addEventListener("didCancelObjectBinding", this);
            app.addEventListener("didAddObjectsFromTemplate", this);

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
    },

    handleDidChangeObjectProperties: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;
            var ownerModuleId = ownerProxy ? ownerProxy.exportId : null;

            this.previewController.setPreviewObjectProperties(proxy.label, ownerModuleId, event.detail.properties).done();
        }
    },

    handleDidSetObjectBinding: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            var binding = {
                propertyName: event.detail.binding.targetPath,
                propertyDescriptor: {}
            };
            var oneway = event.detail.binding.oneway ? "<-" : "<->";
            binding.propertyDescriptor[oneway] = event.detail.binding.sourcePath;

            this.previewController.setPreviewObjectBinding(
                ownerProxy.exportId, proxy.label, binding)
            .done();
        }
    },

    handleDidCancelObjectBinding: {
        value: function (event) {
            var proxy = event.target;
            var ownerProxy = proxy.editingDocument.editingProxyMap.owner;

            if (!ownerProxy) {
                return;
            }

            this.previewController.deletePreviewObjectBinding(
                ownerProxy.exportId, proxy.label, event.detail.binding.targetPath)
            .done();
        }
    },

    handleDidAddObjectsFromTemplate: {
        value: function (event) {
            var document = event.target;
            var detail = event.detail;

            if (detail.parentNode) {
                this._addTemplateToPreview(detail.template, document, detail.parentNode, detail.nextSiblingNode).done();
            } else {
                this._addTemplateObjectsToPreview(detail.template, document)
            }
        }
    },

    _addTemplateObjectsToPreview: {
        value: function(template, document) {
            var ownerProxy = document.editingProxyMap.owner;
            var templateFragment = {
                serialization: template.objectsString
            };

            return this.previewController.addTemplateFragmentObjects(
                    ownerProxy.exportId, templateFragment)
                .done();
        }
    },

    /**
     * When adding a template content to the preview we need to provide three
     * pieces of information:
     * - The component where the content was added. (ownerModuleId + label)
     * - The argument name if the content was added to an argument of the
     *   component. (argumentName)
     * - A CSS selector from the component or the argument node that points to
     *   the exact node where the content was added. (cssSelector)
     */
    _addTemplateToPreview: {
        value: function(template, document, parentNode, nextSiblingNode) {
            var templateFragment;
            var ownerProxy = document.editingProxyMap.owner;
            var node = nextSiblingNode || parentNode;
            var nodeCount = template.document.body.children.length;
            var anchorNodeIsStarArgument;
            var componentNode;
            var argumentNode;
            var anchorNode;
            var cssSelector = "";
            var how;

            if (!ownerProxy) {
                return Promise.resolve();
            }

            // Find the component where the template content was inserted.
            // We also check to see if this change was done inside a named
            // argument element.
            componentNode = parentNode;
            do {
                if (componentNode.component) {
                    break;
                } else if (componentNode.montageArg) {
                    argumentNode = componentNode;
                }
            } while (componentNode = /* assignment */ componentNode.parentNode);

            // If this change was done inside a named parameter then the
            // anchor node is the component itself, otherwise it's the argument
            // node
            anchorNode = argumentNode || componentNode;

            // Generate the css selector path.
            // The css selector is similar in concept to an xpath, we create a
            // path of direct children from the anchor to the node.
            // :scope in this case means the container element.
            // For star arguments (non-named arguments) we need to adopt a
            // different strategy for selecting the first node in the path
            // because there is no container element, just a range of them.
            // :scope in this case means the first element of the range and we
            // select the first node of the path using the + adjacent sibling
            // selector.
            if (!argumentNode && componentNode.component !== ownerProxy) {
                anchorNodeIsStarArgument = true;
            }

            do {
                var ix = node.parentNode.children.indexOf(node);
                // If this node is the nextSibling then we need to decrease the
                // index because the insertTemplateContent already happened so
                // we need to take into account the additional nodes added by it.
                if (node == nextSiblingNode) {
                    ix -= nodeCount;
                }

                // We use a different strategy for the selector of the first
                // node in the path for star arguments.
                if (anchorNodeIsStarArgument && node.parentNode === anchorNode) {
                    cssSelector = new Array(ix+1).join("+ * ") + cssSelector;
                } else {
                    cssSelector = "> *:nth-child(" + (ix+1) + ")" + cssSelector;
                }
            } while ((node = node.parentNode) && node !== anchorNode);
            cssSelector = ":scope " + cssSelector;

            if (nextSiblingNode) {
                how = "before";
            } else {
                how = "append";
            }

            templateFragment = {
                serialization: template.objectsString,
                html: template.document.body.innerHTML
            };

            return this.previewController.addTemplateFragment(
                    ownerProxy.exportId, componentNode.component.label,
                    argumentNode ? argumentNode.montageArg : null, cssSelector,
                    how, templateFragment)
                .done();
        }
    }
});
