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
            }, function() {
                self._showErrorPanel(chainIdentifier);
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
            var applicationDelegate = application.delegate;

            message = "Build successful." + (message ? "<br>" + message + "" : "");

            applicationDelegate.showModal = true;
            applicationDelegate.currentPanelKey = "info";
            applicationDelegate.infoPanel.getResponse(message)
            .then(function() {
                applicationDelegate.showModal = false;
                applicationDelegate.currentPanelKey = null;
            }).done();
        }
    },

    _showProgressPanel: {
        value: function() {
            var applicationDelegate = application.delegate;

            applicationDelegate.showModal = true;
            applicationDelegate.currentPanelKey = "progress";
            applicationDelegate.progressPanel.message = "Building...";
        }
    },

    _updateProgressPanelMessage: {
        value: function(message) {
            var applicationDelegate = application.delegate;

            applicationDelegate.progressPanel.message = "Building: " + message;
        }
    },

    _hideProgressPanel: {
        value: function() {
            var applicationDelegate = application.delegate;

            applicationDelegate.showModal = false;
            applicationDelegate.currentPanelKey = null;
        }
    },

    _showErrorPanel: {
        value: function(chainIdentifier) {
            var self = this;
            var applicationDelegate = application.delegate;

            applicationDelegate.showModal = true;
            applicationDelegate.currentPanelKey = "confirm";
            applicationDelegate.confirmPanel.getResponse("Building error", true, "Retry", "Close")
            .then(function (response) {
                applicationDelegate.showModal = false;
                applicationDelegate.currentPanelKey = null;
                if (response === true) {
                    self.buildFor(chainIdentifier);
                }
            });
        }
    },
});