var PackageTools = require("./package-tools").ToolsBox,
    Montage = require("montage").Montage;

exports.PackageSavingManager = Montage.specialize({

    initWithPackageDocument: {
        value: function (packageDocument) {
            if (!packageDocument || typeof packageDocument !== "object" || !packageDocument.environmentBridge) {
                throw new Error("Cannot init DependencyManager with " + packageDocument);
            }

            this._packageDocument = packageDocument;
            this._environmentBridge = packageDocument.environmentBridge;

            return this;
        }
    },

    _packageDocument: {
        value: null
    },

    _environmentBridge: {
        value: null
    },

    _packageJsonToSaved: {
        value: null
    },

    _packageJsonPending: {
        value: null
    },

    _savingTimer: {
        value: null
    },

    _savingInProgressPromise: {
        value: null
    },

    _needUpdateDependencyCollection: {
        value: null
    },

    scheduleSaving: {
        value: function (time, needUpdateDependencyCollection) {
            var self = this,
                packageJson = this._packageDocument.toJSON();

            if (this._savingInProgressPromise && this._savingInProgressPromise.isPending()) {
                if (!this._needUpdateDependencyCollection) {
                    this._needUpdateDependencyCollection = !!needUpdateDependencyCollection;
                }

                this._packageJsonPending = packageJson;
            } else {
                if (this._savingTimer) {
                    clearTimeout(this._savingTimer);
                }

                this._packageJsonToSaved = packageJson;
                this._needUpdateDependencyCollection = !!needUpdateDependencyCollection;

                this._savingTimer = setTimeout(function () {

                    self._savingInProgressPromise = self._saveModification().then(function () {

                        self._packageJsonToSaved = null;
                        self._saveTimer = null;
                    });

                    self._packageDocument.dispatchAsyncActivity(self._savingInProgressPromise, "Saving modification");

                }, typeof time === "number" ? time : 400); //TODO fix this number
            }
        }
    },

    getPackageJson: {
        value: function () {
            return this._packageJsonToSaved;
        }
    },

    _saveModification: {
        value: function () {
            var self = this,
                packageDocument = this._packageDocument;

            return this._environmentBridge.save(packageDocument, packageDocument.url).then(function () {
                if (self._packageJsonPending) {
                    self._packageJsonToSaved = self._packageJsonPending;
                    self._packageJsonPending = null;

                    return self._saveModification();

                } else if (self._needUpdateDependencyCollection) {

                    return packageDocument._updateDependenciesAfterSaving();
                }
            });
        }
    }

});
