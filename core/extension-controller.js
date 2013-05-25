var Montage = require("montage/core/core").Montage,
    Target = require("montage/core/target").Target,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application;

exports.ExtensionController = Montage.create(Target, {

    _applicationDelegate: {
        value: null
    },

    applicationDelegate: {
        get: function () {
            return this._applicationDelegate;
        }
    },

    /**
     * The collection of all extensions loaded by the projectController.
     * Note that these are not necessarily active, simply loaded.
     */
    loadedExtensions: {
        value: null
    },

    /**
     * The collection of all active extensions
     */
    activeExtensions: {
        value: null
    },

    constructor: {
        value: function () {
            this.loadedExtensions = [];
            this.activeExtensions = [];
        }
    },

    init: {
        value: function (applicationDelegate) {
            this._applicationDelegate = applicationDelegate;
            this.nextTarget = application;
            return this;
        }
    },

    loadExtensions: {
        value: function () {
            var self = this,
                bridge = this.applicationDelegate.environmentBridge;

            return bridge.availableExtensions.then(function (extensionUrls) {
                return Promise.all(extensionUrls.map(function (entry) {
                    return self.loadExtension(entry.url);
                }), function (error) {
                    console.log("Could not load extensions");
                    return Promise.reject(new Error("Could not load extensions", error));
                });
            }).then(function (extensions) {
                    self.loadedExtensions = extensions;

                    application.addEventListener("activateExtension", self);
                    application.addEventListener("deactivateExtension", self);

                    return extensions;
                }, function (error) {
                    console.log("Could not load extensions", error);
                    return [];
                });
        }
    },

    handleActivateExtension: {
        value: function (evt) {
            this.activateExtension(evt.detail).done();
        }
    },

    handleDeactivateExtension: {
        value: function (evt) {
            this.deactivateExtension(evt.detail).done();
        }
    },

    /**
     * Asynchronously load the extension package from the specified
     * extensionUrl, returning a reference to the exported Extension.
     *
     * When called as a method on an instance of a ProjectController
     * the loadedExtension will be added to the instance's
     * loadedExtensions collection automatically.
     *
     * @param {string} extensionUrl The extension package Url to load
     * @return {Promise} A promise for the exported Extension object
     */
    loadExtension: {
        enumerable: false,
        value: function (extensionUrl) {

            var self = this;

            // TODO npm install?
            return require.loadPackage(extensionUrl).then(function (packageRequire) {
                return Promise.all([packageRequire.async("extension"), Promise.resolve(packageRequire)]);
             },function (error) {
                console.log("Could not load extension package at: " + extensionUrl);
                return Promise.reject(new Error("Could not load extension package at: " + extensionUrl, error));
            }).spread(function (exports, require) {
                    var extension = new exports.Extension();
                    extension.extensionRequire = require;

                    if (!extension) {
                        throw new Error("Malformed extension. Expected '" + extensionUrl + "' to export 'Extension'");
                    }

                    if (self.loadedExtensions) {
                        self.loadedExtensions.push(extension);
                    }

                    return extension;
                }, function (error) {
                    console.log("Could not load extension at: " + extensionUrl);
                    return Promise.reject(new Error("Could not load extension at: " + extensionUrl, error));
                });
        }
    },

    /**
     * Asynchronously activate the specified extension
     *
     * @param {Extension} extension The extension to activate
     * @return {Promise} A promise for the activated extension
     */
    activateExtension: {
        value: function (extension) {
            if (!extension) {
                return;
            }
            var activationPromise;

            if (-1 === this.activeExtensions.indexOf(extension)) {

                this.dispatchEventNamed("willActivateExtension", true, false, extension);
                this.activeExtensions.push(extension);

                if (typeof extension.activate === "function") {
                    //TODO only pass along the applicationDelegate?
                    activationPromise = extension.activate(this.applicationDelegate.application, this.applicationDelegate.projectController, this.applicationDelegate.viewController);
                } else {
                    activationPromise = Promise.resolve(extension);
                }

            } else {
                activationPromise = Promise.reject(new Error("Cannot activate an active extension"));
            }

            return activationPromise;
        }
    },

    /**
     * Asynchronously deactivate the specified extension
     *
     * @param {Extension} extension The extension to deactivate
     * @return {Promise} A promise for the deactivated extension
     */
    deactivateExtension: {
        value: function (extension) {
            if (!extension) {
                return;
            }

            var deactivationPromise,
                index = this.activeExtensions.indexOf(extension);

            if (index > -1) {

                this.dispatchEventNamed("willDeactivateExtension", true, false, extension);
                this.activeExtensions.splice(index, 1);

                if (typeof extension.deactivate === "function") {
                    //TODO only pass along the applicationDelegate
                    deactivationPromise = extension.deactivate(this.applicationDelegate.application, this.applicationDelegate.projectController, this.applicationDelegate.viewController);
                } else {
                    deactivationPromise = Promise.resolve(extension);
                }

            } else {
                deactivationPromise = Promise.reject(new Error("Cannot deactivate an inactive extension"));
            }

            return deactivationPromise;
        }
    }

});
