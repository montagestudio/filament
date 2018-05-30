var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application;

var optimizeMessages = {
    "reading": "Reading files...",
    "writing": "Writing files...",
    "processing": "Processing files...",
    "bundling": "Bundling files..."
};

exports.Build = Montage.specialize({
    constructor: {
        value: function Build() {
            this.super();
            this._chains = [];
        }
    },

    _chains: {
        value: null
    },

    /**
     * @param {MenuItem} parentMenuItem The menu item that will host all build
     *        chains.
     */
    init: {
        value: function(environmentBridge) {
            this._environmentBridge = environmentBridge;
        }
    },

    /**
     * @callback performBuildStep
     * @param {string} buildPath The directory path of the build.
     * @param {object=} options Optional parameters defined by the user.
     */

    /**
     * @typedef {object} BuildStep
     * @property {string=} name The step name.
     * @property {object=} thisp Value to use as this when executing
     *           performBuildStep.
     *           invoked to perform the build step.
     * @property {performBuildStep} performBuildStep The function that will be
     *           invoked to perform the build step.
     */

    /**
     * Adds a new chain to build for.
     *
     * @param {string} identifier Identifier string to use when building for
     *        this chain.
     * @param {string} name The name to use when display information about this
     *        chain in the UI.
     * @param {Array.<BuildStep>} stepsBeforeOptimize list of steps to
     *        perform before the optimization step.
     * @param {Array.<BuildStep>} stepsAfterOptimize list of steps to
     *        perform after the optimization step.
     *
     */
    addChain: {
        value: function(identifier, name, stepsBeforeOptimize, stepsAfterOptimize) {
            var chain = {
                identifier: identifier,
                name: name,
                stepsBeforeOptimize: stepsBeforeOptimize || [],
                stepsAfterOptimize: stepsAfterOptimize || []
            };

            this._chains[identifier] = chain;
            this.callDelegateMethod("didAddBuildChain", chain);
        }
    },

    removeChain: {
        value: function(identifier) {
            var chain = this._chains[identifier];

            delete this._chains[identifier];
            this.callDelegateMethod("didRemoveBuildChain", chain);
        }
    },

    getChain: {
        value: function(identifier) {
            return this._chains[identifier];
        }
    },

    _optimize: {
        value: function() {
            var self = this;
            var bridge = this._environmentBridge;

            return bridge.buildOptimize({
                status: function(status) {
                    var message = optimizeMessages[status] || status;
                    self._updateProgressPanelMessage(message);
                }
            });
        }
    },

    buildFor: {
        value: function(chainIdentifier) {
            var self = this;
            var chain = this.getChain(chainIdentifier);
            var options = {
                updateStatusMessage: function(message) {
                    self._updateProgressPanelMessage(message);
                }
            };

            this._showProgressPanel();
            return this._performBuildSteps(chain.stepsBeforeOptimize, options)
            .then(function() {
                return self._optimize();
            })
            .then(function() {
                return self._performBuildSteps(chain.stepsAfterOptimize, options);
            })
            .then(function(message) {
                self._hideProgressPanel();
                self._showInfoPanel(message);
            }, function(error) {
                self._showErrorPanel(chainIdentifier);
                throw error;
            });
        }
    },

    _performBuildSteps: {
        value: function(buildSteps, options) {
            return buildSteps.reduce(function(promise, buildStep) {
                return promise.then(function() {
                    return buildStep.performBuildStep.call(buildStep.thisp, options);
                });
            }, Promise.resolve());
        }
    },

    _showInfoPanel: {
        value: function(message) {
            var workbench = this._environmentBridge.workbench;
            message = "Build successful." + (message ? "<br>" + message + "" : "");
            workbench.showModal = true;
            workbench.currentPanelKey = "info";
            workbench.infoPanel.getResponse(message)
                .then(function() {
                    workbench.showModal = false;
                    workbench.currentPanelKey = null;
                }).done();
        }
    },

    _showProgressPanel: {
        value: function() {
            var workbench = this._environmentBridge.workbench;
            workbench.showModal = true;
            workbench.currentPanelKey = "progress";
            workbench.progressPanel.message = "Building...";
        }
    },

    _updateProgressPanelMessage: {
        value: function(message) {
            var workbench = this._environmentBridge.workbench;
            workbench.progressPanel.message = "Building: " + message;
        }
    },

    _hideProgressPanel: {
        value: function() {
            var workbench = this._environmentBridge.workbench;

            workbench.showModal = false;
            workbench.currentPanelKey = null;
        }
    },

    _showErrorPanel: {
        value: function(chainIdentifier) {
            var self = this;
            var workbench = this._environmentBridge.workbench;

            workbench.showModal = true;
            workbench.currentPanelKey = "confirm";
            workbench.confirmPanel.getResponse("Building error", true, "Retry", "Close")
            .then(function (response) {
                workbench.showModal = false;
                workbench.currentPanelKey = null;
                if (response === true) {
                    self.buildFor(chainIdentifier);
                }
            });
        }
    },
});
