/*global Rollbar*/
var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise,
    //TODO I wouldn't expect the project list to house this functionality
    repositoriesController = require("project-list/core/repositories-controller").repositoriesController;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
            var originalOnerror = Promise.onerror;
            Promise.onerror = function (error) {
                if (Rollbar) {
                    Rollbar.error(error);
                }
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

    showModal: {
        value: false
    },

    currentPanelKey: {
        value: null
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
            return Promise.resolve();
        }
    },

    willLoadProject: {
        value: function () {
            var self = this,
                bridge = this.environmentBridge,
                populatedRepositoryPromise;

            self.showModal = true;
            self.currentPanelKey = "progress";
            self.progressPanel.message = "Checking repository...";

            return bridge.isProjectEmpty().then(function (isEmpty) {
                if (isEmpty) {
                    // Bare repository, create a project and commit
                    self.showModal = true;
                    self.currentPanelKey = "initialize";
                    self._deferredRepositoryInitialization = Promise.defer();
                    populatedRepositoryPromise = self._deferredRepositoryInitialization.promise;
                } else {
                    //Repository exists, do we have a project workspace for it?
                    populatedRepositoryPromise = bridge.projectExists().then(function (exists) {
                        if (!exists) {
                            //TODO check if it's a montage project or not: cute message otherwise
                            // No workspace, make one
                            self.showModal = true;
                            self.currentPanelKey = "progress";
                            self.progressPanel.message = "Cloning project and installing dependencies...";

                            return bridge.initializeProject().then(function () {
                                self.showModal = false;
                                self.currentPanelKey = null;
                            });
                        } else {
                            // Workspace found, all systems go!
                            self.showModal = false;
                            return Promise.resolve();
                        }
                    });
                }

                return populatedRepositoryPromise;
            })
            .catch(function(err) {
                self.currentPanelKey = "confirm";
                self.showModal = true;
                Rollbar.error(new Error("Error setting up the project."));

                return self.confirmPanel.getResponse("Error setting up the project.", true, "Retry", "Close").then(function (response) {
                    self.showModal = false;
                    if (response === true) {
                        return self.willLoadProject();
                    } else {
                        window.location = "/";
                        return Promise.defer();
                    }
                });
            });
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
            }).done();

            return superPromise;
        }
    },

    handleInitializeRepository: {
        value: function () {
            var bridge = this.environmentBridge,
                self = this;

            if (bridge) {
                bridge.isProjectEmpty().then(function (isEmpty) {
                    if (isEmpty) {
                        self.currentPanelKey = "progress";
                        self.progressPanel.message = "Initializing project and installing dependencies...";

                        var promise = self._deferredRepositoryInitialization;
                        bridge.initializeProject().then(function () {
                            self.showModal = false;
                            self.currentPanelKey = null;
                        }).then(promise.resolve, promise.reject);
                    }
                }).done();
            }
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
