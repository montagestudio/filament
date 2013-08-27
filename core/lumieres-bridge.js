/* global lumieres */
var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    adaptConnection = require("q-connection/adapt"),
    Promise = require("montage/core/promise").Promise,
    qs = require("qs"),
    mainMenu = require("ui/native-menu/menu").defaultMenu,
    FileDescriptor = require("core/file-descriptor").FileDescriptor,
    defaultLocalizer = require("montage/core/localizer").defaultLocalizer,
    PATH = require("core/path");

exports.LumiereBridge = EnvironmentBridge.specialize({

    constructor: {
        value: function LumiereBridge() {
            this.super();

            var self = this;

            Montage.addPathChangeListener.call(lumieres, "previewPort", function() {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
            }, null, true);

            Montage.addPathChangeListener.call(lumieres, "previewPort", function() {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });
        }
    },

    _undoMessagePromise: {
        value: defaultLocalizer.localize("undo_label", "Undo {label}")
    },
    _redoMessagePromise: {
        value: defaultLocalizer.localize("redo_label", "Redo {label}")
    },

    _backend: {
        value: null
    },

    backend: {
        get: function () {
            var self = this,
                resolvePort = function () {
                    if (lumieres.nodePort) {
                        port.resolve(lumieres.nodePort);
                    }
                };

            if (self._backend == null) {
                var port = Promise.defer();
                if (lumieres.nodePort) {
                    port.resolve(lumieres.nodePort);
                } else {
                    while (port.promise.isPending()) {
                        port.promise.delay(20).then(resolvePort);
                    }
                }
                var connection = adaptConnection(new WebSocket("ws://localhost:" + lumieres.nodePort));
                connection.closed.then(function () {
                    self._backend = null;
                });

                self._backend = Connection(connection);
            }

            return self._backend;
        }
    },

    _deferredProjectInfo: {
        value: null
    },

    convertBackendUrlToPath: {
        value: function (url) {
            return url.replace(/^\w+:\/\/\w*/m, "");
        }
    },

    previewUrl: {
        get: function () {
            return "http://localhost:" + lumieres.previewPort;
        }
    },

    userPreferences: {
        get: function () {
            var deferredPrefs = Promise.defer();

            lumieres.getUserPreferences(function (error, result) {
                if (!error) {
                    deferredPrefs.resolve(result);
                } else {
                    deferredPrefs.reject(error);
                }
            });

            return deferredPrefs.promise;
        }
    },

    projectUrl: {
        get: function () {
            var params = qs.parse(window.location.search.replace(/^\?/, "")),
                fileParam = params.file;

            return fileParam;
        }
    },

    // TODO read, and validate, project info provided by a discovered .lumiereproject file?
    // TODO more and more of this is being read dynamically by the projectController
    // especially as it can change during runtime, so we consider doing even less up front
    projectInfo: {
        value: function (projectUrl) {

            var self = this;

            return this.findPackage(this.convertBackendUrlToPath(projectUrl))
            .then(function (packageUrl) {
                return self.dependenciesInPackage(packageUrl)
                .then(function (dependencies) {
                    return {
                        "fileUrl": projectUrl,
                        "packageUrl": packageUrl,
                        "dependencies": dependencies
                    };
                });
            });
        }
    },

    availableExtensions: {
        get: function () {
            return this.backend.get("filament-backend").invoke("getExtensions");
        }
    },

    getExtensionsAt: {
        value: function (url) {
            return this.backend.get("filament-backend").invoke("getExtensions", this.convertBackendUrlToPath(url));
        }
    },

    findPackage: {
        value: function (path) {
            var self = this;

            return self.backend.get("fs").invoke("exists", path + "/package.json").then(function (exists) {
                if (exists) {
                    return "fs://localhost" + path;
                } else if ("/" === path) {
                    return;
                } else {
                    return self.backend.get("fs").invoke("normal", path + "/..")
                        .then(function (parentPath) {
                            return self.findPackage(parentPath);
                        });
                }
            });
        }
    },

    componentsInPackage: {
        value: function (packageUrl) {
            return this.backend.get("filament-backend").invoke("listPackage", this.convertBackendUrlToPath(packageUrl), true).then(function (fileDescriptors) {
                return fileDescriptors.filter(function (fd) {
                    return (/\.reel\/$/).test(fd.url);
                }).map(function (fd) {
                    return fd.url;
                });
            });

        }
    },

    listTreeAtUrl: {
        value: function (url) {
            return this.backend.get("filament-backend").invoke("listTree", url).then(function (fileDescriptors) {
                return fileDescriptors.map(function (fd) {
                    return FileDescriptor.create().initWithUrlAndStat(fd.url, fd.stat);
                });
            });
        }
    },

    list: {
        value: function (url) {
            return this.backend.get("filament-backend").invoke("list", url).then(function (fileDescriptors) {
                return fileDescriptors.map(function (fd) {
                    return FileDescriptor.create().initWithUrlAndStat(fd.url, fd.stat);
                });
            });
        }
    },

    dependenciesInPackage: {
        value: function (packageUrl) {
            return this.backend.get("fs").invoke("read", PATH.join(this.convertBackendUrlToPath(packageUrl), "package.json"), {"charset": "utf-8"})
                .then(function (content) {
                    var packageInfo = JSON.parse(content),
                        dependencyNames = Object.keys(packageInfo.dependencies);

                    //TODO implement mapping in addition to just dependencies
                    //TODO also report the version of the dependency

                    return dependencyNames.map(function (dependencyName) {
                        return {"dependency": dependencyName, "url": packageUrl + "/node_modules/" + dependencyName};
                    });
                });
        }
    },

    promptForSave: {
        value: function (options) {
            var deferredSave = Promise.defer();

            lumieres.saveFileDialog(options, function (error, file) {
                file = decodeURI(file);
                if (!error) {
                    deferredSave.resolve(file);
                } else {
                    deferredSave.resolve(null);
                }
            });

            return deferredSave.promise;
        }
    },

    promptForOpen: {
        value: function (options) {
            var deferredOpen = Promise.defer();

            lumieres.openFileDialog(options, function (error, file) {
                if (!error) {
                    deferredOpen.resolve(file);
                } else {
                    deferredOpen.resolve(null);
                }
            });

            return deferredOpen.promise;
        }
    },

    openNewApplication: {
        value: function () {
            return this.backend.get("application").invoke("openDocument", {type: "application"});
        }
    },

    createApplication: {
        value: function (name, packageHome) {
            var self = this,
                packagePath = this.convertBackendUrlToPath(packageHome),
            //TODO use fs join to make all these
                applicationPath = packagePath + "/" + name,
                applicationUrl = packageHome + "/" + name;

            return self.backend.get("fs").invoke("exists", applicationPath).then(function (result) {
                if (result) {
                    return self.backend.get("application").invoke("moveToTrash", applicationUrl);
                }
            }).then(function () {
                return self.backend.get("filament-backend").invoke("createApplication", name, packagePath)
                    .then(function (minitResults) {
                        if (!minitResults || !minitResults.name) {
                            console.log("TODO: remove this error checking when minit returns promises: (see pull request montagejs/minit/pull/47), using the name entered by user.");
                        }else{
                            // Use the name from minit normalization
                            applicationUrl = packageHome + "/" + minitResults.name;
                        }
                        lumieres.document.setFileURL(applicationUrl);
                        return applicationUrl;
                    }, function (error) {
                        console.log("Could not create the application " + name + " at " + packagePath, error);
                        throw error;
                    });
            });
        }
    },

    createComponent: {
        value: function (name, packageHome, destination) {
            return this.backend.get("filament-backend").invoke("createComponent", name, this.convertBackendUrlToPath(packageHome), destination)
                .then(function (path) {
                    return "fs://localhost" + path + "/";
                });
        }
    },

    createModule: {
        value: function (name, packageHome, destination) {
            return this.backend.get("filament-backend").invoke("createModule", name, this.convertBackendUrlToPath(packageHome), destination);
        }
    },

    open: {
        value: function (url) {
            return this.backend.get("application").invoke("openDocument", {url: url});
        }
    },

    save: {
        value: function (editingDocument, location) {

            var dataWriter = function (self, flags) {
                return function (data, path) {
                    path = self.convertBackendUrlToPath(path);
                    return self.writeDataToFilePath(data, path, flags);
                };
            };

            return editingDocument.save(location, dataWriter(this, {flags: "w", charset: 'utf-8'}));
        }
    },

    writeDataToFilePath: {
        value: function (data, path, flags) {

            if (!lumieres.nodePort) {
                // TODO improve error
                throw new Error("No port provided for filesystem connection");
            }

            return this.backend.get("fs").invoke("write", path, data, flags);
        }
    },

    installDependencies: {
        value: function (config) {
            return this.backend.get("filament-backend").invoke("installDependencies", config);
        }
    },

    mainMenu: {
        get: function () {
            return Promise.resolve(mainMenu);
        }
    },

    watch: {
        value: function (path, ignoreSubPaths, changeHandler, errorHandler) {
            var local = {
                    handleChange: function () {
                        changeHandler.apply(this, arguments);
                    },
                    handleError: function () {
                        errorHandler.apply(this, arguments);
                    }
                },
                backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort), local);

            path = this.convertBackendUrlToPath(path);
            return backend.get("filament-backend").invoke("watch", path, ignoreSubPaths, Promise.master(local));
        }
    },

    registerPreview: {
        value: function (name, url) {
            return this.backend.get("preview").invoke("register", {name: name, url: url});
        }
    },

    launchPreview: {
        value: function (previewId) {
            return this.backend.get("preview").invoke("launch", previewId);
        }
    },

    refreshPreview: {
        value: function (previewId) {
            return this.backend.get("preview").invoke("refresh", previewId);
        }
    },

    unregisterPreview: {
        value: function (previewId) {
            return this.backend.get("preview").invoke("unregister", previewId);
        }
    },

    setUndoState: {
        value: function (state, label) {
            var undoMenuItem = mainMenu.menuItemForIdentifier("undo");
            undoMenuItem.enabled = state;

            if (this._undoMessagePromise.isResolved()) {
                undoMenuItem.title = this._undoMessagePromise.valueOf()({label: label || ""});
            } else {
                var self = this;
                this._undoMessagePromise.then(function (undoMessage) {
                    self.setUndoState(state, label);
                }).done();
            }
        }
    },

    setRedoState: {
        value: function (state, label) {
            var redoMenuItem = mainMenu.menuItemForIdentifier("redo");
            redoMenuItem.enabled = state;

            if (this._redoMessagePromise.isResolved()) {
                redoMenuItem.title = this._redoMessagePromise.valueOf()({label: label || ""});
            } else {
                var self = this;
                this._redoMessagePromise.then(function (undoMessage) {
                    self.setRedoState(state, label);
                }).done();
            }
        }
    },

    setDocumentDirtyState: {
        value: function (state) {
            lumieres.document.dirty = state;
        }
    },

    openFileWithDefaultApplication: {
        value: function (url) {
            return this.backend.get("application").invoke("openFileWithDefaultApplication", url);
        }
    },

    openHttpUrl: {
        value: function (url) {
            if (url.indexOf("http") !== 0) {
                Promise.reject(new Error(url + " does not begin with 'http'"));
            }
            return this.backend.get("filament-backend").invoke("open", url);
        }
    }

});
