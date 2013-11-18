var ApplicationDelegate = require("./application-delegate").ApplicationDelegate,
    Promise = require("montage/core/promise").Promise;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
        }
    },

    _deferredRepositoryIntialization: {
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
                    self.showModal = true;
                    self.currentPanelKey = "initialize";
                    self._deferredRepositoryIntialization = Promise.defer();
                    populatedRepositoryPromise = self._deferredRepositoryIntialization.promise;
                } else {
                    populatedRepositoryPromise = Promise.resolve();
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
                            self._deferredRepositoryIntialization.resolve();
                        });
                    }
                }).done();
            }
        }
    }

});
