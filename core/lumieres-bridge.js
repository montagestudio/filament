var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    Promise = require("montage/core/promise").Promise,
    qs = require("qs");

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

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

            lumieres.getUserPreferences(function (success, result) {
                if (success) {
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
                reelParam = params.file,
                reelUrl;

            if (reelParam && !reelParam.match(/fs:\/\(null\)/)) {
                reelUrl = reelParam;
            }

            return reelUrl;
        }
    },

    // TODO read, and validate, project info provided by a discovered .lumiereproject file?
    projectInfo: {
        value: function (projectUrl) {

            var self = this,
                packageUrl;

            if (!this._deferredProjectInfo) {
                this._deferredProjectInfo = Promise.defer();

                this.findPackage(this.convertBackendUrlToPath(projectUrl))
                    .then(function (url) {
                        packageUrl = url;
                        //TODO what if no packageUrl? How did it get this far if that's the case, can it?
                        return [self.componentsInPackage(url), self.dependenciesInPackage(url)];
                    })
                    .spread(function (componentUrls, dependencies) {

                        if (packageUrl) {
                            packageUrl = "fs:/" + packageUrl;
                        }

                        self._deferredProjectInfo.resolve({
                            "reelUrl": projectUrl, //TODO rename this ? is it always a reel?
                            "packageUrl": packageUrl,
                            "componentUrls": componentUrls,
                            "dependencies": dependencies
                        });

                    }).done();
            }

            return this._deferredProjectInfo.promise;
        }
    },

    availablePlugins: {
        get: function () {
            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("lumieres").invoke("getPlugins");
        }
    },

    findPackage: {
        value: function (path, backend) {
            if (!backend) {
                backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            }

            var self = this;
            return backend.get("fs").invoke("exists", path + "/package.json").then(function (exists) {
                if (exists) {
                    return path;
                } else if ("/" === path) {
                    return;
                } else {
                    return backend.get("fs").invoke("normal", path + "/..")
                        .then(function (parentPath) {
                            return self.findPackage(parentPath, backend);
                        });
                }
            });
        }
    },

    //TODO react to changes on the filesystem (created components, deleted components)
    //TODO also find non-components, "LibraryItems"
    componentsInPackage: {
        value: function (packageUrl) {

            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));

            return backend.get("fs").invoke("normal", packageUrl + "/ui")
                .then(function (uiPath) {
                    return backend.get("fs").invoke("list", uiPath)
                        .then(function (listing) {
                            return listing.filter(function (entry) {
                                return !!entry.match(/\.reel$/);
                            }).map(function (reelEntry) {
                                return uiPath + "/" + reelEntry;
                            });
                        }, function () {
                            // Couldn't find components where we'd expect? That's fine
                            return null;
                        });
                });
        }
    },

    dependenciesInPackage: {
        value: function (packageUrl) {

            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));

            return backend.get("fs").invoke("read", packageUrl + "/package.json", {"charset": "utf-8"})
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

            lumieres.saveFileDialog(options, function (success, file) {
                if (success) {
                    var destination = file.replace("file://localhost", "");
                    deferredSave.resolve("fs:/" + destination);
                } else {
                    deferredSave.reject();
                }
            });

            return deferredSave.promise;
        }
    },

    openNewApplication: {
        value: function () {
            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("application").invoke("openDocument", {type: "application"});
        }
    },

    createApplication: {
        value: function (name, packageHome) {
            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("lumieres").invoke("createApplication", name, this.convertBackendUrlToPath(packageHome))
                .then(function () {
                    return packageHome + "/" + name;
                });
        }
    },

    open: {
        value: function (url) {
            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("application").invoke("openDocument", {url: url});
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

            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("fs").invoke("write", path, data, flags);
        }
    },

    installDependencies: {
        value: function (config) {
            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            return backend.get("lumieres").invoke("installDependencies", config);
        }
    }
});
