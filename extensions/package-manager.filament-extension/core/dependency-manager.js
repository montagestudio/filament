var DependencyManagerQueue = require("./dependency-manager-queue").DependencyManagerQueue,
    PackageTools = require("./package-tools").ToolsBox,
    Promise = require("montage/core/promise").Promise,
    Montage = require("montage").Montage;

var DependencyManager = Montage.specialize({

    initWithPackageDocument: {
        value: function (packageDocument) {
            if (!packageDocument || typeof packageDocument !== "object" && packageDocument.environmentBridge) {
                throw new Error("Cannot init DependencyManager with " + packageDocument);
            }

            this.reset();
            this._packageDocument = packageDocument;

            var queueManager = new DependencyManagerQueue();
            this._dependencyManagerQueue = queueManager.initWithEnvironmentBridge(this._packageDocument.environmentBridge);

            this.defineBinding("isBusy", {"<-": "_dependencyManagerQueue.isBusy", source: this});

            return this;
        }
    },

    _dependencyManagerQueue: {
        value: null
    },

    isBusy: {
        value: null
    },

    _createRequest: {
        value: function (name, version) {
            var request = PackageTools.isGitUrl(version) ? version : null;

            if (!request && PackageTools.isNameValid(name)) {
                request = name;

                if (version && PackageTools.isVersionValid(version)) {
                    request += '@' + version;
                }
            }

            return request;
        }
    },

    _createOperation: {
        value: function (request, operationType) {
            return {
                request: request,
                operationType: operationType
            };
        }
    },

    _pendingOperations: {
        value: null
    },

    reset: {
        value: function () {
            this._pendingOperations = {};
        }
    },

    hasPendingOperations: {
        value: function () {
            return Object.keys(this._pendingOperations).length > 0;
        }
    },

    executePendingOperation: {
        value: function () {
            var pendingOperation = this._pendingOperations,
                pendingOperationKeys = Object.keys(this._pendingOperations),
                deferred = Promise.defer(),
                self = this;

            this.reset();

            Promise.allSettled(pendingOperationKeys.map(function (operationKey) {
                var operation = pendingOperation[operationKey],
                    dependency = self._packageDocument.findDependency(operationKey),
                    promise = null;

                    dependency.isBusy = true;

                if (operation.operationType === DependencyManagerQueue.ACTIONS.INSTALL) {
                    promise = self._dependencyManagerQueue.installModule(operation.request)
                        .then(function (listDependencyInstalled) {

                            // The DependencyManagerQueue will always install dependencies one by one.
                            var packageInstalled = listDependencyInstalled.length > 0 ? listDependencyInstalled[0] : null;

                            if (packageInstalled) {
                                // The requested package name  could be different than the installed package name.
                                packageInstalled.requestedName = dependency.name;
                                packageInstalled.operation = DependencyManager.ACTIONS.INSTALL;
                                deferred.notify(packageInstalled);
                            }

                            return packageInstalled;

                        }, function (error) {
                            deferred.notify({
                                error: error,
                                name: operationKey,
                                operation: DependencyManager.ACTIONS.INSTALL
                            });
                        });
                } else {
                    promise = self._dependencyManagerQueue.uninstallModule(operation.request)
                        .then(function (packageRemoved) {
                            if (packageRemoved) {
                                packageRemoved.operation = DependencyManager.ACTIONS.UNINSTALL;
                                deferred.notify(packageRemoved);
                            }

                            return packageRemoved;

                        }, function (error) {
                            deferred.notify({
                                error: error,
                                name: operationKey,
                                operation: DependencyManager.ACTIONS.UNINSTALL
                            });
                        });
                }

                return promise;

            })).spread(function () {
                var packagesModified = arguments;

                for (var i = 0, length = packagesModified.length; i < length; i++) {
                    var packageModified = packagesModified[i];

                    if (packageModified.state === "rejected") {
                        deferred.reject(packageModified.reason);
                        break;
                    }
                }

                if (deferred.promise.isPending()) {
                    deferred.resolve("All modification have been saved");
                }
            }).done();

            return deferred.promise;
        }
    },

    installDependency: {
        value: function (name, version) {
            var request = this._createRequest(name, version),
                dependency = this._packageDocument.findDependency(name);

            if (request) {
                var operation = this._createOperation(request, DependencyManager.ACTIONS.INSTALL);

                if (dependency && !dependency.missing && dependency.versionInstalled === version) {
                    if (this._pendingOperations[name]) {
                        delete this._pendingOperations[name];
                        this._packageDocument._changeCount--;
                    }
                } else {
                    this._pendingOperations[name] = operation;
                    this._packageDocument._changeCount++;

                    return true;
                }
            }

            return false;
        }
    },

    removeDependency: {
        value: function (name) {
            var dependency = this._packageDocument.findDependency(name),
                packageDocument =  this._packageDocument,
                request = this._createRequest(name);

            if (request && dependency) {
                if (!dependency.missing) {
                    var operation = this._createOperation(request, DependencyManager.ACTIONS.UNINSTALL);

                    this._pendingOperations[name] = operation;
                    packageDocument._changeCount++;

                } else if (dependency.missing && this._pendingOperations[name]) {
                    if (!dependency.state.canBeMissing ||
                        (dependency.state.canBeMissing && !packageDocument._isPackageFileHasDependency(name))) {

                        packageDocument._changeCount--;
                    }

                    delete this._pendingOperations[name];
                    packageDocument._removeDependencyFromCollection(dependency);

                } else {
                    packageDocument._changeCount--;
                }
            }
        }
    }

});

DependencyManager.ACTIONS = DependencyManagerQueue.ACTIONS;

exports.DependencyManager = DependencyManager;
