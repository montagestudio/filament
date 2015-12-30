var DependencyManagerQueue = require("./dependency-manager-queue").DependencyManagerQueue,
    Confirm = require("matte/ui/popup/confirm.reel").Confirm,
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

            this.defineBinding("isBusy", {"<-": "_dependencyManagerQueue.isBusy || _immediateOperationsCount > 0", source: this});

            return this;
        }
    },

    _dependencyManagerQueue: {
        value: null
    },

    _immediateOperationsCount: {
        value: 0
    },

    isBusy: {
        value: null
    },

    _createRequest: {
        value: function (name, version) {
            var request = PackageTools.isNpmCompatibleGitUrl(version) ? version : null;

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

            Promise.all(pendingOperationKeys.map(function (operationKey) {
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

            })).catch(function(reason) {
                deferred.reject(reason);
            }).then(function() {
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
                    }

                    dependency.state.pendingInstall = false;
                } else {
                    this._pendingOperations[name] = operation;
                    dependency.state.pendingInstall = true;
                }
            }
        }
    },

    removeDependency: {
        value: function (name) {
            var dependency = this._packageDocument.findDependency(name),
                packageDocument =  this._packageDocument,
                dependencyState = dependency.state,
                request = this._createRequest(name);

            if (request && dependency) {
                dependencyState.pendingRemoval = true;

                if (!dependency.missing) {
                    var operation = this._createOperation(request, DependencyManager.ACTIONS.UNINSTALL);

                    this._pendingOperations[name] = operation;

                } else if (dependency.missing && this._pendingOperations[name]) {
                    var packageNotInstalled = packageDocument._isPackageFileHasDependency(name);

                    if (!dependencyState.canBeMissing || (dependencyState.canBeMissing && !packageNotInstalled)) {

                        packageDocument._removeDependencyFromCollection(dependency);
                    }

                    if (dependencyState.canBeMissing && packageNotInstalled) {
                        dependencyState.pendingRemoval = false;
                        dependencyState.acceptInstall = true;
                    }

                    delete this._pendingOperations[name];
                }
            }
        }
    },

    _reinstallDependency: {
        value: function (dependencyName, dependencyVersion) {
            if (typeof dependencyName === "string" && dependencyName.length > 0) {
                var dependency = this._packageDocument.findDependency(dependencyName);

                if (dependency) {
                    var environmentBride = this._packageDocument.environmentBridge,
                        request = this._createRequest(dependencyName, dependencyVersion),
                        self = this,
                        promise = null;

                    dependency.isBusy = true;
                    this._immediateOperationsCount++;

                    if (dependency.missing) {
                        promise = environmentBride.installPackages(request);
                    } else if (dependency.extraneous) {
                        var confirmCloseDialogOptions = {
                            message: "Add '" + dependencyName + "' as a dependency?",
                            okLabel: "Add",
                            cancelLabel: "Remove"
                        },

                        deferred = Promise.defer();

                        Confirm.show(confirmCloseDialogOptions, function () {
                            var document = self._packageDocument;

                            //save the extraneous dependency within the package.json
                            environmentBride.save(document, document.url).then(function () {
                                deferred.resolve(true);
                            }, deferred.reject).done();
                        }, function () {
                            // Remove the extraneous dependency
                            environmentBride.removePackage(dependencyName).then(deferred.resolve, deferred.reject);
                        });

                        promise = deferred.promise;

                    } else {
                        promise = environmentBride.removePackage(dependencyName).then(function () {
                            return environmentBride.installPackages(request);
                        });
                    }

                    return promise.then(function () {
                        dependency.problems = dependency.update = null;
                        dependency.extraneous = dependency.missing = false;

                    }).finally(function () {
                        dependency.isBusy = false;
                        self._immediateOperationsCount--;
                        self._packageDocument.needRefresh = true;
                    });
                }
            }

            return Promise.reject("Invalid dependency");
        }
    },

    updateDependency: {
        value: function (dependencyName, dependencyVersion) {
            return this._reinstallDependency(dependencyName, dependencyVersion).then(function () {
                return dependencyName + " has been updated";
            });
        }
    },

    repairDependency: {
        value: function (dependencyName) {
            return this._reinstallDependency(dependencyName).then(function () {
                return dependencyName + " has been repaired";
            });
        }
    }

});

DependencyManager.ACTIONS = DependencyManagerQueue.ACTIONS;

exports.DependencyManager = DependencyManager;
