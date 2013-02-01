var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    adaptConnection = require("q-connection/adapt"),
    Promise = require("montage/core/promise").Promise,
    qs = require("qs"),
    mainMenu = require("ui/native-menu/menu").defaultMenu,
    FileDescriptor = require("core/file-descriptor").FileDescriptor;

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    _backend: {
        value: null
    },

    backend: {
        get: function() {
            var self = this;

            if (self._backend == null) {
                var connection = adaptConnection(new WebSocket("ws://localhost:" + lumieres.nodePort));
                connection.closed.then(function() {
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
            return url.replace(/^\w+:\//m, "");
        }
    },

    userPreferences: {
        get: function () {
            var deferredPrefs = Promise.defer();

            lumieres.getUserPreferences(function (error, result) {
                if (!error) {
                    deferredPrefs.resolve(result);
                } else {
                    deferredPrefs.reject();
                }
            });

            return deferredPrefs.promise;
        }
    },

    projectUrl: {
        get: function () {
            var params = qs.parse(window.location.search.replace(/^\?/, "")),
                fileParam = params.file,
                fileUrl;

            if (fileParam && !fileParam.match(/fs:\/\(null\)/)) {
                fileUrl = fileParam;
            }

            return fileUrl;
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

                            if (packageUrl) {
                                packageUrl = "fs:/" + packageUrl;
                            }

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
            return this.backend.get("lumieres").invoke("getExtensions");
        }
    },

    findPackage: {
        value: function (path) {
            var self = this;

            return self.backend.get("fs").invoke("exists", path + "/package.json").then(function (exists) {
                if (exists) {
                    return path;
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

    //TODO also find non-components, "LibraryItems"
    componentsInPackage: {
        value: function (packageUrl) {
            var self = this;

            return self.backend.get("fs").invoke("normal", packageUrl + "/ui")
                .then(function (uiPath) {
                    return self.backend.get("fs").invoke("exists", uiPath).then(function (exists) {
                        if (exists) {
                            return self.backend.get("fs").invoke("list", uiPath).then(function (listing) {
                                return listing.filter(function (entry) {
                                    return !!entry.match(/\.reel$/);
                                }).map(function (reelEntry) {
                                    return uiPath + "/" + reelEntry;
                                });
                            });
                        } else {
                            return null;
                        }
                    });
                });
        }
    },

    listTreeAtUrl: {
        value: function (url) {
            return this.backend.get("lumieres").invoke("listTree", url).then(function (fileDescriptors) {
                return fileDescriptors.map(function (fd) {
                    return FileDescriptor.create().initWithUrlAndStat(fd.url, fd.stat);
                });
            });
        }
    },

    dependenciesInPackage: {
        value: function (packageUrl) {
            return this.backend.get("fs").invoke("read", packageUrl + "/package.json", {"charset": "utf-8"})
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
                if (!error) {
                    var destination = file.replace("file://localhost", "");
                    deferredSave.resolve("fs:/" + destination);
                } else {
                    deferredSave.resolve(null);
                }
            });

            return deferredSave.promise;
        }
    },

    openNewApplication: {
        value: function () {
            return this.backend.get("application").invoke("openDocument", {type: "application"});
        }
    },

    createApplication: {
        value: function (name, packageHome) {
            return this.backend.get("lumieres").invoke("createApplication", name, this.convertBackendUrlToPath(packageHome))
                .then(function () {
                    var applicationUrl = packageHome + "/" + name;
                    lumieres.document.setFileURL(applicationUrl);
                    return applicationUrl;
                });
        }
    },

    createComponent: {
        value: function (name, packageHome, destination) {
            var backend = this.backend;
            return backend.get("lumieres").invoke("createComponent", name, this.convertBackendUrlToPath(packageHome), destination)
                .then(function () {
                    return backend.get("fs").invoke("join", packageHome, destination, name);
                }).then(function (componentPath) {
                    return componentPath;
                });
        }
    },

    open: {
        value: function (url) {
            return this.backend.get("application").invoke("openDocument", {url: url});
        }
    },

    save: {
        value: function (editingDocument, location) {

            //TODO I think I've made this regex many times...and probably differently
            var filenameMatch = location.match(/.+\/(.+)\.reel/),
                filename,
                path,
                content,
                template = editingDocument.template;

            if (!(filenameMatch && filenameMatch[1])) {
                throw "Could not find name for file to save";
            }

            filename = filenameMatch[1];

            path = this.convertBackendUrlToPath(location) + "/" + filename + ".html";
            content = template.exportToString();

            // TODO replace the low-level writing promise with a promise to save
            return this.writeDataToFilePath(content, path, {flags: "w", charset: 'utf-8'});
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
            return this.backend.get("lumieres").invoke("installDependencies", config);
        }
    },

    mainMenu: {
        get: function () {
            return Promise.resolve(mainMenu);
        }
    },

    watch: {
        value: function (path, changeHandler) {
            var local = {
                    handleChange: function (changeType, filePath) {
                        changeHandler(changeType, filePath);
                    }
                },
                backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort), local);

            path = this.convertBackendUrlToPath(path);
            return backend.get("lumieres").invoke("watch", path, Promise.master(local));
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
            lumieres.undoManager.setUndoState(state, label);
        }
    },

    setRedoState: {
        value: function (state, label) {
            lumieres.undoManager.setRedoState(state, label);
        }
    },

    setDocumentDirtyState: {
        value: function (state) {
            lumieres.document.dirty = state;
        }
    }
});
