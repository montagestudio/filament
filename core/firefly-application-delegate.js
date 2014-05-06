var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    //TODO I wouldn't expect the project list to house this functionality
    repositoriesController = require("project-list/core/repositories-controller").repositoriesController;

var LICENSES = require("./licenses.html").content;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
            var originalOnerror = Promise.onerror;
            Promise.onerror = function (error) {
                track.error(error);
                return originalOnerror(error);
            };
        }
    },

    _deferredRepositoryInitialization: {
        value: null
    },

    progressPanel: {
        value: null
    },

    promptPanel: {
        value: null
    },

    initializeRepositoryPanel: {
        value: null
    },

    unknownRepositoryPanel: {
        value: null
    },

    mergePanel: {
        value: null
    },

    mergeConflictPanel: {
        value: null
    },

    showModal: {
        value: false
    },

    currentPanelKey: {
        value: null
    },

    updateStatusMessage: {
        value: function(message) {
            this.environmentBridge.progressPanel.message = message;
        }
    },

    willFinishLoading: {
        value: function (app) {
            this.super(app);

            // TODO this is a temporary workaround to redirect keyEquivalents to the
            // toolbar as a last resort if they make it up here
            app.addEventListener("keyPress", this);
            app.addEventListener("menuAction", this, false);
        }
    },

    didLoadEnvironmentBridge: {
        value: function () {
            //TODO the bridge and the appDelegate are fighting over responsibilities…
            var bridge = this.environmentBridge;
            bridge.progressPanel = this.progressPanel;
            bridge.promptPanel = this.promptPanel;
            bridge.confirmPanel = this.confirmPanel;
            bridge.applicationDelegate = this;
            bridge.userController.getUser().then(function (user) {
                track.setUsername(user.login);
            });
            return Promise.resolve();
        }
    },

    willLoadProject: {
        value: function () {
            var self = this,
                bridge = this.environmentBridge;

            self.showModal = true;
            self.currentPanelKey = "progress";
            self.progressPanel.message = "Verifying project…";

            return bridge.repositoryExists()
                .then(function (exists) {
                    self.progressPanel.message = "Verifying repository…";

                    return Promise.all([
                        Promise(exists),
                        (exists ? bridge.isProjectEmpty().then(function (empty) { return !empty; }) : Promise(false)),
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

                    return Promise(readyWorkspacePromise);

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
                                return Promise(false);
                            }
                        });
                });
        }
    },

    loadProject: {
        value: function(projectUrl) {
            var self = this;
            var deferred = Promise.defer();
            var superMethod = ApplicationDelegate.prototype.loadProject;

            var loadProject = function() {
                self.currentPanelKey = "progress";
                self.progressPanel.message = "Loading project…";
                self.showModal = true;
                track.message("loading project");
                superMethod.call(self, projectUrl)
                .then(deferred.resolve)
                .fail(loadProjectFail)
                .done();
            };

            var loadProjectFail = function(reason) {
                var message = reason.message || "Internal Server Error";
                console.log(message);
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

            return deferred.promise;
        }
    },

    didLoadProject: {
        value: function () {
            var superPromise = this.super(),
                self = this;

            superPromise.then(function () {
                return self._bridgePromise;
            }).then(function (bridge) {
                var project = {
                    owner: bridge.repositoryController.owner,
                    repo: bridge.repositoryController.repo
                };
                repositoriesController.addRepositoryToRecent(project);

                self.showModal = false;
                self.currentPanelKey = null;
            }).done();

            return superPromise;
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
                            self.progressPanel.message = "Initializing project and installing dependencies…";
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
                self.progressPanel.message = "Initializing project and installing dependencies…";

                initializationPromise = bridge.initializeProject();
            }

            return Promise(initializationPromise);
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
