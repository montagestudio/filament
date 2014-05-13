var Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    MontageReviver = require("montage/core/serialization/deserializer/montage-reviver").MontageReviver,
    LibraryItem = require("core/library-item").LibraryItem,
    Map = require("montage/collections/map");

exports.Extension = Target.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
            this._packageNameLibraryItemMap = new Map();
            this._packageNameIconUrlsMap = new Map();
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
                        rootModuleId = url.replace(extensionRequire.location, ''),
                        modulePath = rootModuleId + libraryItemModuleName,
                        moduleId = modulePath + ".js",
                        templateModuleId = modulePath + ".html",
                        jsonModuleId = modulePath + ".json";

                    // First we try to load a *.json file rather than executing a module.
                    // If it fails and only if the extension is not issued by a third party (node_module folder)
                    // then we require the js module.
                    return extensionRequire.async(jsonModuleId).then(function (exports) {
                            if (!exports || !exports.name || !exports.iconUrl) {
                                throw new Error("Library Item json file is incomplete.\n" + JSON.stringify(exports) + "\ngiven, where {name:... , description:... , iconUrl:...} is required.");
                            }
                            var libraryItem = new LibraryItem();
                            libraryItem.uri = url;
                            libraryItem.name = exports.name;
                            if (exports.libraryItem) {
                                libraryItem.description = exports.description;
                            }
                            libraryItem.iconUrl = url + exports.iconUrl;
                            libraryItem.require = extensionRequire;
                            libraryItem.templateModuleId = templateModuleId;

                            return libraryItem;
                        }, function (error) {
                            if (url.indexOf("node_module") !== -1) {
                                throw new Error ("Library Item json file not found at: " + jsonModuleId);
                            }
                            return extensionRequire.async(moduleId).then(function (exports) {
                                var libraryItem;
                                libraryItem = new exports[libraryItemModuleInfo.objectName]();
                                libraryItem.uri = url;

                                libraryItem.require = extensionRequire;
                                libraryItem.templateModuleId = templateModuleId;

                                return libraryItem;
                            });
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
    },

    _packageNameIconUrlsMap: {
        value: null
    },

    _loadIconUrlsForPackageName: {
        value: function (serviceProvider, packageName) {
            var extensionRequire = this.extensionRequire;

            return serviceProvider.listModuleIconUrls(extensionRequire.location, packageName).then(function (urls) {

                return urls.reduce(function (iconMap, url) {
                    // NOTE the url for the icon captures the moduleId within the directory hierarchy;
                    // strip away everything but that hierarchy before parsing it with the MontageReviver's
                    // utility function
                    //e.g. "extension/icons/foo/bar/baz.png" is the icon representing the module "foo/bar/baz"
                    var moduleLocationFragment = url.replace(extensionRequire.location + "icons/", "").replace(/\.[^\.]+$/m, ""),
                        iconModuleInfo = MontageReviver.parseObjectLocationId(moduleLocationFragment);

                    iconMap.set(iconModuleInfo.moduleId, url);
                    return iconMap;
                }, new Map());
            });
        }
    },

    installModuleIcons: {
        value: function (projectController, packageName) {

            // TODO similar concern echoing that of installLibraryItems
            var serviceProvider = projectController.environmentBridge,
                moduleIdIconUrlMap = this._packageNameIconUrlsMap.get(packageName),
                promisedIconUrlMap;

            if (moduleIdIconUrlMap) {
                promisedIconUrlMap = Promise.resolve(moduleIdIconUrlMap);
            } else {
                promisedIconUrlMap = this._loadIconUrlsForPackageName(serviceProvider, packageName);
            }

            return promisedIconUrlMap.then(function (iconUrlMap) {
                var iconEntries = iconUrlMap.entries(),
                    moduleId,
                    iconUrl;
                iconEntries.forEach(function (iconEntry) {
                    moduleId = iconEntry[0];
                    iconUrl = iconEntry[1];
                    projectController.addIconUrlForModuleId(iconUrl, moduleId);
                });
            }).thenResolve(this);
        }
    },

    uninstallModuleIcons: {
        value: function (projectController, packageName) {

            var moduleIdIconUrlMap = this._packageNameIconUrlsMap.get(packageName),
                iconEntries,
                moduleId,
                iconUrl;

            if (moduleIdIconUrlMap) {
                iconEntries = moduleIdIconUrlMap.entries();

                iconEntries.forEach(function (iconEntry) {
                    moduleId = iconEntry[0];
                    iconUrl = iconEntry[1];
                    projectController.removeIconUrlForModuleId(iconUrl, moduleId);
                });
            }

            return Promise.resolve(this);
        }
    }

});
