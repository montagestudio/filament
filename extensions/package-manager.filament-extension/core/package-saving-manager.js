var Promise = require("montage/core/promise").Promise,
    DependencyManager = require('./dependency-manager').DependencyManager,
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
        value: function (url, dataWriter) {
            var self = this,
                packageJson = this._packageDocument.toJSON();

            if (this._savingInProgressPromise && this._savingInProgressPromise.isPending()) {
                this._packageJsonPending = packageJson;
                return Promise(true);
            }

            this._savingInProgressPromise = this._performSaving(packageJson, url, dataWriter);

            //todo localize
            this._packageDocument.dispatchAsyncActivity(this._savingInProgressPromise, "Saving modification");

            return this._savingInProgressPromise.finally(function () {
                // todo display the saving report
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
        value: function (packageJson, url, dataWriter) {
            var self = this;

            if (this._dependencyManager.hasPendingOperations()) {
                return this._dependencyManager.executePendingOperation().then(function () {
                    return self._saveModification(packageJson, url, dataWriter);

                }, null, this._handlePackageModified.bind(this));
            }

            return this._saveModification(packageJson, url, dataWriter);
        }
    },

    _handlePackageModified: {
        value: function (packageModified) {
            if (packageModified) {
                if (packageModified.operation === DependencyManager.ACTIONS.INSTALL && !packageModified.error) {
                    this._packageDocument._dependencyHasBeenInstalled(packageModified);
                } else if (packageModified.operation === DependencyManager.ACTIONS.UNINSTALL && !packageModified.error) {
                    this._packageDocument._dependencyHasBeenRemoved(packageModified);
                }
            }

            this._writeReport(packageModified.name, packageModified.operation, packageModified.error);
        }
    },

    _writeReport: {
        value: function (packageName, operation, error) {
            var message = "[" + packageName + "]: ";

            if (error) {
                message += error.message;
            } else {
                // todo localize
                message += "has been " + (operation === DependencyManager.ACTIONS.INSTALL ? "installed" : "removed");
            }

            this._reportLastSaving.push(message);
        }
    },

    _saveModification: {
        value: function (packageJson, url, dataWriter) {
            var self = this;

            return this._packageDocument._writePackageJson(packageJson, url, dataWriter).then(function () {
                if (self._packageJsonPending) {
                    packageJson = self._packageJsonPending;
                    self._packageJsonPending = null;

                    return self._performSaving(packageJson, url, dataWriter);

                }

                return self._packageDocument._updateDependenciesAfterSaving();
            });
        }
    }

});
