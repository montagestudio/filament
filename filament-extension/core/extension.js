var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    Map = require("montage/collections/map");

exports.Extension = Target.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
            this._packageNameLibraryItemMap = new Map();
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

    _packageNameLibraryItemMap: {
        value: null
    },

    //TODO paramaterize this and underlying services so it can be used by an extensions to find library items in different locations
    // Don't assume an extensions only affects a single package?
    _loadLibraryItemsForPackageName: {
        value: function (serviceProvider, packageName) {
            var self = this,
                extensionRequire = this.extensionRequire;

            //TODO what if the desired service isn't offered, is a different version; where are we resolving all of that?
            //TODO here, or in the service itself, we should find library items by package directory within the extension
            return serviceProvider.listLibraryItemUrls(this.constructor.packageLocation, packageName).then(function (urls) {
                return Promise.all(urls.map(function (url) {
                    var libraryItemModuleName = url.match(/([^\/]+)\.library-item\/$/m)[1],
                        libraryItemModuleInfo = MontageReviver.parseObjectLocationId(libraryItemModuleName),
                        libraryItemModuleUrl = url.replace(extensionRequire.location, '') + libraryItemModuleName + ".js";

                    return extensionRequire.async(libraryItemModuleUrl).then(function (exports) {
                        return new exports[libraryItemModuleInfo.objectName]();
                    });
                }));
            }).then(function (libraryItems) {
                self._packageNameLibraryItemMap.set(packageName, libraryItems);
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
                libraryItems = this._packageNameLibraryItemMap.get(packageName),
                promisedLibraryItems;

            if (libraryItems) {
                promisedLibraryItems = Promise.resolve(libraryItems);
            } else {
                promisedLibraryItems = this._loadLibraryItemsForPackageName(serviceProvider, packageName);
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

            if (this._packageNameLibraryItemMap) {
                this._packageNameLibraryItemMap.forEach(function (libraryItem) {
                    projectController.removeLibraryItemFromPackage(libraryItem, packageName);
                });
            }
            return Promise.resolve(this);
        }
    }

});
