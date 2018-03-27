var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    ExtensionController = require("core/extension-controller").ExtensionController,
    ViewController = require("core/view-controller").ViewController,
    PreviewController = require("core/preview-controller").PreviewController,
    ProjectController = require("core/project-controller").ProjectController,
    ReelDocument = require("core/reel-document").ReelDocument,
    Document = require("palette/core/document").Document,
    FilamentService = require("core/filament-service").FilamentService,
    repositoriesController = require("core/repositories-controller").repositoriesController,
    request = require("./request");

var LICENSES = require("./licenses.html").content;

exports.ApplicationDelegate = Montage.specialize({

    _bridgePromise: {
        value: null
    },

    getEnvironmentBridge: {
        value: function () {
            var self = this;
            var bridgePromise = this._bridgePromise;

            if (!bridgePromise) {
                bridgePromise = require.async("adaptor/client/core/environment-bridge").then(function (exported) {
                    return new exported.EnvironmentBridge().init("filament-backend", new FilamentService(self));
                });
                this._bridgePromise = bridgePromise;
            }

            return bridgePromise;
        }
    },

    isAuthenticated: {
        value: null
    },

    isProjectOpen: {
        value: null
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

    _deferredRepositoryInitialization: {
        value: null
    },

    showModal: {
        value: false
    },

    isProjectLoaded: {
        value: false
    },

    currentPanelKey: {
        value: null
    },

    constructor: {
        value: function () {
            var self = this;
            this._deferredApplication = Promise.defer();
            this._deferredMainComponent = Promise.defer();

            // TODO: Should only do this if the workbench is being loaded
            this.viewController = new ViewController();
            this.previewController = (new PreviewController()).init(this);

            request.requestOk({ url: "/auth" })
                .then(function () {
                    self.isAuthenticated = true;
                    return Promise.all([self._deferredApplication.promise, self._deferredMainComponent.promise]);
                })
                .spread(function (app, mainComponent) {
                    var pathname = window.location.pathname;

                    self.application = app;
                    self.mainComponent = mainComponent;

                    if (pathname.split("/").length === 3) {
                        // --> /owner/repo
                        self.isProjectOpen = true;
                        self.loadWorkbench();
                    } else {
                        // --> /
                        self.isProjectOpen = false;
                    }
                })
                .catch(function () {
                    self.isAuthenticated = false;
                })
                .done();
        }
    },

    loadWorkbench: {
        value: function () {
            var self = this,
                extensionController,
                loadedExtensions,
                projectController,
                preloadDocument;

            // Make stack traces from promise errors easily available in the
            // console. Otherwise you need to manually inspect the error.stack
            // in the debugger.
            Promise.onerror = function (error) {
                track.error(error);
                if (error.stack) {
                    console.groupCollapsed("%c Uncaught promise rejection: " + (error.message || error), "color: #F00; font-weight: normal");
                    console.log(error.stack);
                    console.groupEnd();
                } else {
                    throw error;
                }
            };

            this.getEnvironmentBridge()
                .then(function (bridge) {
                    self.environmentBridge = bridge;

                    //TODO move this elsewhere, maybe rename to specifically reflect the stage of bootstrapping
                    return self.didLoadEnvironmentBridge().then(function () {
                        return bridge.mainMenu;
                    }).then(function(mainMenu) {
                        self.application.mainMenu = mainMenu;
                    });
                }).then(function () {
                    return self.willLoadProject();
                }).then(function () {
                    extensionController = self.extensionController = new ExtensionController().init(self);
                    return extensionController.loadExtensions().catch(function (error) {
                        console.log("Failed loading extensions, proceeding with none");
                        return [];
                    }).then(function(extensions) {
                        loadedExtensions = extensions;
                    });
                }).then(function () {
                    var editorController = self.mainComponent.workbench;
                    projectController = self.projectController = new ProjectController().init(
                        self.environmentBridge, self.viewController, editorController, extensionController,
                        self.previewController, self
                    );

                    projectController.registerUrlMatcherForDocumentType(function (fileUrl) {
                        return (/\.reel\/?$/).test(fileUrl);
                    }, ReelDocument);

                    // Ensure that the currentEditor is considered the nextTarget before the application
                    //TODO should probably be the document
                    self.mainComponent.defineBinding("nextTarget", {"<-": "projectController.currentEditor", source: self});

                    //TODO not activate all extensions by default
                    return Promise.all(loadedExtensions.map(function (extension) {
                        return extensionController.activateExtension(extension);
                    }));
                }).then(function () {
                    preloadDocument = new Document().init("ui/component.reel");
                    projectController.documents.push(preloadDocument);
                    projectController.selectDocument(preloadDocument);

                    return self.environmentBridge.projectUrl
                        .then(function (projectUrl) {
                            return projectUrl || projectController.createApplication();
                        });
                }).then(function (projectUrl) {
                    // With extensions now loaded and activated, load a project
                    return self.loadProject(projectUrl)
                        .then(function () {
                            var ix = projectController.documents.indexOf(preloadDocument);
                            projectController.documents.splice(ix, 1);

                            //TODO only do this if we have an index.html
                            return self.previewController.registerPreview(projectUrl, projectUrl + "/index.html");
                        }).then(function () {
                            //TODO not launch the preview automatically?
                            return self.previewController.launchPreview();
                        });
                }).then(function () {
                    return self.didLoadProject();
                }).catch(function (error) {
                    console.error("Failed loading application");
                    return error;
                }).done();
        }
    },

    updateStatusMessage: {
        value: function(message) {
            this.environmentBridge.progressPanel.message = message;
        }
    },

    /**
     * @return {Promise} A promise to continue
     */
    didLoadEnvironmentBridge: {
        value: function () {
            //TODO the bridge and the appDelegate are fighting over responsibilities…
            var bridge = this.environmentBridge;
            bridge.applicationDelegate = this;
            if (typeof bridge.setEnableFileDrop === "function") {
                bridge.setEnableFileDrop(true);
            }
            return bridge.userController.getUser().then(function (user) {
                track.setUsername(user.login);
                return null;
            });
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
            var self = this,
                bridge = this.environmentBridge;

            self.showModal = true;
            self.currentPanelKey = "progress";
            self.updateStatusMessage("Verifying project…");

            return bridge.repositoryExists()
                .then(function (exists) {
                    self.updateStatusMessage("Verifying repository…");

                    return Promise.all([
                        Promise.resolve(exists),
                        (exists ? bridge.isProjectEmpty().then(function (empty) { return !empty; })
                            : Promise.resolve(false)),
                        bridge.workspaceExists()
                    ]);
                })
                .spread(function (repositoryExists, repositoryPopulated, workspaceStatus) {
                    var readyWorkspacePromise;

                    if (!repositoryExists) {

                        if (workspaceStatus === "initializing") {
                            throw new Error("Initializing a project for a repository that no longer exists");
                        } else if (workspaceStatus) {
                            // Workspace exists, repository has gone missing
                            // TODO offer to discard workspace or create repo from workspace
                            throw new Error("Repository no longer exists for project.");
                        } else {
                            // No repo and no workspace
                            self.currentPanelKey = "unknown";
                            readyWorkspacePromise = self.unknownRepositoryPanel.getResponse()
                                .then(function (response) {
                                    if (response) {
                                        return self._createRepository(response.name, response.description);
                                    } else {
                                        window.location = "/";
                                    }
                                });
                        }
                    } else {
                        // The repository exists…
                        if (repositoryPopulated) {
                            if (workspaceStatus === "initializing" || !workspaceStatus) {
                                // Project exists and is currently building the container workspace
                                // or
                                // Project is populated with content, no workspace exists
                                // TODO check if we should bother creating a workspace for this repo
                                // Hopefully it's not about to run minit to try and reinitialize the project
                                readyWorkspacePromise = self._initializeProject();
                            }
                        } else {
                            // The repository exists but is empty…
                            if (workspaceStatus === "initializing") {
                                // Busy initializing
                                readyWorkspacePromise = self._initializeProject();
                            } else if (workspaceStatus) {
                                // Must have just wrapped up workspace will be pushed soon
                                readyWorkspacePromise = self._initializeProject();
                            } else {
                                // Repository exists, is empty, and we have no workspace
                                self.currentPanelKey = "initialize";
                                readyWorkspacePromise = self.initializeRepositoryPanel.getResponse()
                                    .then(function (response) {
                                        if (response) {
                                            return self._initializeProject();
                                        } else {
                                            window.location = "/";
                                        }
                                    });
                            }
                        }
                    }

                    return readyWorkspacePromise;
                })
                .catch(function(err) {
                    var message = err.message || "Internal Server Error";

                    self.currentPanelKey = "confirm";
                    track.error(new Error("Error setting up the project: " + message));

                    return self.confirmPanel.getResponse("Error setting up the project: " + message, true, "Retry", "Close")
                        .then(function (response) {
                            self.showModal = false;
                            if (response === true) {
                                return self.willLoadProject();
                            } else {
                                window.location = "/";
                                return Promise.resolve(false);
                            }
                        });
                });
        }
    },

    loadProject: {
        value: function(projectUrl) {
            var self = this;
            return new Promise(function(resolve) {
                var loadProject = function() {
                    self.currentPanelKey = "progress";
                    self.updateStatusMessage("Loading project…");
                    self.showModal = true;
                    track.message("loading project");
                    self.projectController.loadProject(projectUrl)
                        .then(resolve, loadProjectFail);
                };

                var loadProjectFail = function(reason) {
                    var message = reason.message || "Internal Server Error";
                    console.error(reason);
                    self.currentPanelKey = "confirm";
                    track.error("Couldn't load project: " + message);

                    self.confirmPanel.getResponse("Error loading the project", true, "Retry", "Close")
                        .then(function (response) {
                            self.showModal = false;
                            if (response === true) {
                                loadProject();
                            } else {
                                window.location = "/";
                            }
                        });
                };

                loadProject();
            });
        }
    },

    /**
     * @return {Promise} A promise to continue
     */
    didLoadProject: {
        value: function () {
            this.showModal = false;
            this.isProjectLoaded = true;
            this.currentPanelKey = null;
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

            // TODO this is a temporary workaround to redirect keyEquivalents to the
            // toolbar as a last resort if they make it up here
            app.addEventListener("keyPress", this);
            app.addEventListener("menuAction", this, false);

            this._deferredApplication.resolve(app);
        }
    },

    willClose: {
        value: function () {
            //TODO only if we're registered
            this.previewController.unregisterPreview().done();
        }
    },

    _createRepository: {
        value: function (name, description) {
            var self = this,
                bridge = this.environmentBridge;

            this.currentPanelKey = "progress";
            this.progressPanel.message = "Creating repository…";

            return repositoriesController.createRepository(name, description)
                .then(function () {

                    // Delay reporting initialization to distribute progress more evenly
                    Promise.delay(7000)
                        .then(function (result) {
                            self.currentPanelKey = "progress";
                            self.updateStatusMessage("Initializing project and installing dependencies…");
                        })
                        .done();

                    return bridge.initializeProject();
                });
        }
    },

    _initializeProject: {
        value: function () {
            var bridge = this.environmentBridge,
                self = this,
                initializationPromise;

            if (bridge) {

                self.currentPanelKey = "progress";
                self.updateStatusMessage("Initializing project and installing dependencies…");

                initializationPromise = bridge.initializeProject();
            }

            return Promise.resolve(initializationPromise);
        }
    },

    handleMenuAction: {
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "documentation":
                window.open("http://docs.montagestudio.com/montage-studio/");
                break;
            case "forum":
                window.open("http://forum.montagestudio.com/");
                break;
            case "report":
                window.location = "mailto:feedback@montagestudio.com";
                break;
            case "api":
                window.open("http://docs.montagestudio.com/api/AbstractButton.html");
                break;
            case "framework":
                window.open("http://docs.montagestudio.com/montagejs/");
                break;
            case "licenses":
                var self = this;
                this.showModal = true;
                this.currentPanelKey = "info";
                this.infoPanel.getResponse(LICENSES, "Close")
                .then(function() {
                    self.showModal = false;
                    self.currentPanelKey = null;
                }).done();
                break;
            }
        }
    },

    handleKeyPress: {
        value: function (evt) {
            if ("menuAction" === evt.identifier) {
                var component = evt.keyComposer.component;
                if (typeof component.handleKeyPress === "function") {
                    component.handleKeyPress(evt);
                }
            }
        }
    }
});
