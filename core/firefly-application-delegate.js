var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise,
    Confirm = require("matte/ui/popup/confirm.reel").Confirm,
    //TODO I wouldn't expect the project list to house this functionality
    repositoriesController = require("project-list/core/repositories-controller").repositoriesController;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
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
        }
    },

    didLoadEnvironmentBridge: {
        value: function () {
            //TODO the bridge and the appDelegate are fighting over responsibilities…
            var bridge = this.environmentBridge;
            bridge.progressPanel = this.progressPanel;
            bridge.promptPanel = this.promptPanel;
            bridge.applicationDelegate = this;
            return Promise.resolve();
        }
    },

    willLoadProject: {
        value: function () {
            var self = this,
                bridge = this.environmentBridge,
                populatedRepositoryPromise;

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
                        if (true || !exists) {
                            //TODO check if it's a montage project or not: cute message otherwise
                            // No workspace, make one
                            self.showModal = true;
                            self.currentPanelKey = "progress";

                            return bridge.initializeProject().then(function () {
                                self.showModal = false;
                                self.currentPanelKey = null;
                            }).catch(function(err) {
                                self.showModal = false;

                                var confirmRetry = {
                                    message: "Can't fetch the project.",
                                    okLabel: "Retry",
                                    cancelLabel: "Ignore"
                                };

                                Confirm.show(confirmRetry, function () {
                                    self.willLoadProject();
                                }, function () {});
                            });
                        } else {
                            // Workspace found, all systems go!
                            return Promise.resolve();
                        }
                    });
                }

                return populatedRepositoryPromise;
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
                        return bridge.initializeProject().then(function () {
                            self.showModal = false;
                            self.currentPanelKey = null;
                            self._deferredRepositoryInitialization.resolve();
                        });
                    }
                }).done();
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
