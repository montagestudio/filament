var Promise = require("montage/core/promise").Promise,
    Montage = require("montage").Montage,
    Queue = require("q/queue");

var DependencyManagerQueue = Montage.specialize({

    /**
     * init the dependency manager queue.
     * @function
     * @param {Object} packageDocument, a reference to the packageDocument.
     */
    initWithEnvironmentBridge: {
        value: function (environmentBridge) {
            if (!environmentBridge || typeof environmentBridge !== 'object') {
                throw new Error("Cannot init DependencyManagerQueue with " + environmentBridge);
            }

            this._pendingRequests = [];
            this._queue = new Queue();
            this._environmentBridge = environmentBridge;

            this._chain();

            return this;
        }
    },

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     * @private
     */
    _environmentBridge: {
        value: null
    },

    /**
     * Contains all actions which will be performed once that the package queue manager will be running.
     * @type {Object}
     * @default null
     * @private
     */
    _queue: {
        value: null
    },

    _pendingRequests: {
        value: null
    },

    _pendingRequestsCount: {
        value: 0
    },

    _chain: {
        value: function () {
            var self = this;

            this._queue.get().then(function () {
                if (self._pendingRequestsCount > 0) {
                    var nextRequest = self._nextRequest();

                    if (nextRequest) {
                        self._handleRequest(nextRequest);
                    }
                }

                self._chain();
            });
        }
    },

    _createNewRequest: {
        value: function (request, action) {
            return {
                package: request,
                deferred: Promise.defer(),
                action: action
            };
        }
    },

    _pushRequest: {
        value: function (request) {
            this._pendingRequests.push(request);
            this._pendingRequestsCount++;

            if (!this.isBusy) {
                this.isBusy = true;
            }

            if (this._pendingRequestsCount === 1) {
                this._handleRequest(this._nextRequest());
            }
        }
    },

    _nextRequest: {
        value: function () {
            return this._pendingRequests.shift();
        }
    },

    _handleRequest: {
        value: function (request) {
            var self = this,
                deferred = request.deferred;

            this._queue.put(deferred.promise);

            if (request.action === DependencyManagerQueue.ACTIONS.INSTALL) {
                this._environmentBridge.installPackages(request.package).then(deferred.resolve, deferred.reject)
                .finally(function () {
                    self._handleRequestDone();
                }).done();
            } else {
                this._environmentBridge.removePackage(request.package).then(deferred.resolve, deferred.reject)
                .finally(function () {
                    self._handleRequestDone();
                }).done();
            }
        }
    },

    _handleRequestDone: {
        value: function () {
            this._pendingRequestsCount--;

            if (this.isBusy && this._pendingRequestsCount === 0) {
                this.isBusy = false;
            }
        }
    },

    /**
     * Indicates if the package queue manager is running.
     * @type {Boolean}
     * @default false
     */
    isBusy: {
        value: null
    },

    /**
     * Add to the queue a package to install.
     * @function
     * @param {String} requestedPackage - format accepted: "name[@version]"
     * @return {Promise.<Object>} Promise for the package to install.
     */
    installModule: {
        value: function (requestedPackage) {
            var createdRequest = this._createNewRequest(requestedPackage, DependencyManagerQueue.ACTIONS.INSTALL);

            this._pushRequest(createdRequest);

            return createdRequest.deferred.promise;
        }
    },

    /**
     * Add to the queue a package to uninstall.
     * @function
     * @param {String} requestedPackage - format accepted: "name[@version]"
     * @return {Promise.<Object>} Promise for the package to remove.
     */
    uninstallModule: {
        value: function (requestedPackage) {
            var createdRequest = this._createNewRequest(requestedPackage, DependencyManagerQueue.ACTIONS.UNINSTALL);

            this._pushRequest(createdRequest);

            return createdRequest.deferred.promise;
        }
    }

});

DependencyManagerQueue.ACTIONS = {
    INSTALL: 0,
    UNINSTALL: 1
};

exports.DependencyManagerQueue = DependencyManagerQueue;
