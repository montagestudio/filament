var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver;

exports.Extension = Target.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    extensionRequire: {
        value: null
    },

    name: {
        get: function () {
            return this.extensionRequire.packageDescription.name.replace(/\W*filament-extension$/, "");
        }
    },

    version: {
        get: function () {
            return this.extensionRequire.packageDescription.version;
        }
    },

    supportsFilamentVersion: {
        value: function (version) {
            return false;
        }
    },

    supportsModuleVersion: {
        value: function (moduleId, version) {
            return false;
        }
    },

    //TODO implement a base method that accepts some constrained
    // serviceProvider offered by filament
    //TODO should we keep track of whetherwe are active or not? (or is that recorded elsewhere) might be nice down here
    activate: {
        value: null
    },

    deactivate: {
        value: null
    },

    _libraryItems: {
        value: null
    },

    //TODO paramaterize this and underlying services so it can be used by an extensions to find library items in different locations
    // Don't assume an extensions only affects a single package?
    _loadLibraryItems: {
        value: function (serviceProvider) {
            var self = this,
                extensionRequire = this.extensionRequire;

            //TODO what if the desired service isn't offered, is a different version; where are we resolving all of that?
            return serviceProvider.listLibraryItemUrlsForExtensionUrl(this.constructor.packageLocation).then(function (urls) {
                return Promise.all(urls.map(function (url) {
                    var libraryItemModuleName = url.match(/([^\/]+)\.library-item\/$/m)[1],
                        libraryItemModuleInfo = MontageReviver.parseObjectLocationId(libraryItemModuleName),
                        libraryItemModuleUrl = url.replace(extensionRequire.location, '') + libraryItemModuleName + ".js";

                    return extensionRequire.async(libraryItemModuleUrl).then(function (exports) {
                        return new exports[libraryItemModuleInfo.objectName]();
                    });
                }));
            }).then(function (libraryItems) {
                self._libraryItems = libraryItems;
                return libraryItems;
            });
        }
    },

    installLibraryItems: {
        value: function (projectController, packageName) {

            //TODO hmmm not sure I like going in here to get this, we should
            // probably pass along a bridge (or other service provider/extension interface) with
            // a subset of "safe" services in lieu of all these other bits and pieces of filament
            var serviceProvider = projectController.environmentBridge,
                self = this,
                promisedLibraryItems;

            if (this._libraryItems) {
                promisedLibraryItems = Promise.resolve(this._libraryItems);
            } else {
                promisedLibraryItems = this._loadLibraryItems(serviceProvider);
            }

            return promisedLibraryItems.then(function (libraryItems) {
                libraryItems.forEach(function (libraryItem) {
                    projectController.addLibraryItemToPackage(libraryItem, packageName);
                });
            }).thenResolve(this);
        }
    },

    uninstallLibraryItems: {
        value: function (projectController, packageName) {

            if (this._libraryItems) {
                this._libraryItems.forEach(function (libraryItem) {
                    projectController.removeLibraryItemFromPackage(libraryItem, packageName);
                });
            }
            return Promise.resolve(this);
        }
    }

});
