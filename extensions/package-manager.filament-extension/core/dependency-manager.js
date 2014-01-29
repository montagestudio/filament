var DependencyManagerQueue = require("./dependency-manager-queue").DependencyManagerQueue,
    PackageTools = require("./package-tools").ToolsBox,
    Montage = require("montage").Montage;

var DependencyManager = Montage.specialize({

    initWithEnvironmentBridge: {
        value: function (environmentBridge) {
            if (!environmentBridge || typeof environmentBridge !== "object") {
                throw new Error("Cannot init DependencyManager with " + environmentBridge);
            }

            var queueManager = new DependencyManagerQueue();
            this._dependencyManagerQueue = queueManager.initWithEnvironmentBridge(environmentBridge);

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
            var request = null;

            if (PackageTools.isNameValid(name)) {
                request = name;

                if (version && PackageTools.isVersionValid(version)) {
                    request += '@' + version;
                }
            }

            return request;
        }
    },

    installDependency: {
        value: function (name, version) {
            var request = this._createRequest(name, version);

            return this._dependencyManagerQueue.installModule(request).then(function (listDependencyInstalled) {

                // the DependencyManagerQueue will always install dependencies one by one.
                return listDependencyInstalled.length > 0 ? listDependencyInstalled[0] : null;
            });
        }
    },

    removeDependency: {
        value: function (name) {
            var request = this._createRequest(name);

            return this._dependencyManagerQueue.uninstallModule(request);
        }
    }

});

exports.DependencyManager = DependencyManager;
