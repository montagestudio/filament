var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise;

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

    didLoadEnvironmentBridge: {
        value: function () {
            var bridge = this.environmentBridge;
            bridge.progressPanel = this.progressPanel;
            bridge.promptPanel = this.promptPanel;
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
                        if (!exists) {
                            //TODO check if it's a montage project or not: cute message otherwise
                            // No workspace, make one
                            self.showModal = true;
                            self.currentPanelKey = "progress";
                            return bridge.initializeProject().then(function () {
                                self.showModal = false;
                                self.currentPanelKey = null;
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
    }

});
