var Promise = require("montage/core/promise").Promise,
    DependencyManager = require('./dependency-manager').DependencyManager,
    application = require("montage/core/application").application,
    Montage = require("montage").Montage;

exports.PackageSavingManager = Montage.specialize({

    initWithPackageDocument: {
        value: function (packageDocument) {
            if (!packageDocument || typeof packageDocument !== "object" || !packageDocument._dependencyManager) {
                throw new Error("Cannot init PackageSavingManager with " + packageDocument);
            }

            this._packageDocument = packageDocument;
            this._dependencyManager = packageDocument._dependencyManager;
            this.reset();

            return this;
        }
    },

    _packageDocument: {
        value: null
    },

    _dependencyManager: {
        value: null
    },

    _packageJsonPending: {
        value: null
    },

    _savingInProgressPromise: {
        value: null
    },

    _reportLastSaving: {
        value: null
    },

    scheduleSaving: {
        value: function (url, dataSource) {
            var self = this,
                packageJson = this._packageDocument.toJSON();

            if (this._savingInProgressPromise && this._savingInProgressPromise.isPending()) {
                this._packageJsonPending = packageJson;
                return Promise(true);
            }

            this._savingInProgressPromise = this._performSaving(packageJson, url, dataSource);

            //todo localize
            this._packageDocument.dispatchAsyncActivity(this._savingInProgressPromise, "Saving modification");

            return this._savingInProgressPromise.finally(function () {
                self._reportErrors();
                self.reset();
            });
        }
    },

    reset: {
        value: function () {
            this._reportLastSaving = [];
        }
    },

    _performSaving: {
        value: function (packageJson, url, dataSource) {
            var self = this;

            if (this._dependencyManager.hasPendingOperations()) {
                return this._dependencyManager.executePendingOperation().then(function () {
                    return self._saveModification(packageJson, url, dataSource);

                }, null, this._handlePackageModified.bind(this));
            }

            return this._saveModification(packageJson, url, dataSource);
        }
    },

    _handlePackageModified: {
        value: function (packageModified) {
            if (packageModified) {
                if (packageModified.operation === DependencyManager.ACTIONS.INSTALL && !packageModified.error) {
                    application.dispatchEventNamed("dependencyInstalled", true, true, {
                        installed: packageModified
                    });
                } else if (packageModified.operation === DependencyManager.ACTIONS.UNINSTALL && !packageModified.error) {
                    application.dispatchEventNamed("dependencyRemoved", true, true, {
                        removed: packageModified
                    });
                }
            }

            this._writeReport(packageModified.name, packageModified.operation, packageModified.error);
        }
    },

    _writeReport: {
        value: function (packageName, operation, error) {
            var objectReport = {
                packageName: packageName,
                message: "[" + packageName + "]: ",
                operation: operation,
                error: !!error,
            };

            if (error) {
                objectReport.message += error.message;
            } else {
                // todo localize
                objectReport.message += "has been " + (operation === DependencyManager.ACTIONS.INSTALL ? "installed" : "removed");
            }

            this._reportLastSaving.push(objectReport);
        }
    },

    _reportErrors: {
        value: function () {
            if (this._reportLastSaving.length > 0) {
                var document = this._packageDocument;

                this._reportLastSaving.forEach(function (report) {
                    if (report.error) {
                        document.dispatchAsyncActivity(Promise.reject(report.message), "PackageManager");
                    }
                });
            }
        }
    },

    _saveModification: {
        value: function (packageJson, url, dataSource) {
            var self = this;

            return this._packageDocument._writePackageJson(packageJson, url, dataSource).then(function () {
                if (self._packageJsonPending) {
                    packageJson = self._packageJsonPending;
                    self._packageJsonPending = null;

                    return self._performSaving(packageJson, url, dataSource);

                }

                self._packageDocument.needRefresh = true;

                return self._packageDocument._updateLibraryGroups();
            });
        }
    }

});
