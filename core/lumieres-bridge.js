var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    Promise = require("montage/core/promise").Promise,
    qs = require("qs");

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    _deferredProjectInfo: {
        value: null
    },

    // TODO read, and validate, project info provided by a discovered .lumiereproject file?
    projectInfo: {
        get: function () {

            if (!this._deferredProjectInfo) {
                this._deferredProjectInfo = Promise.defer();

                var params = qs.parse(window.location.search.replace(/^\?/, "")),
                    reelParam = params.file,
                    reelUrl,
                    self = this;

                if (reelParam && !reelParam.match(/fs:\/\(null\)/)) {
                    reelUrl = reelParam;
                }

                this.findPackage(reelUrl.replace("fs:/", "")).then(function (packageUrl) {

                    //TODO what if no packageUrl? How did it get this far if that's the case, can it?

                    self.componentsInPackage(packageUrl).then(function (componentUrls) {

                        if (packageUrl) {
                            packageUrl = "fs:/" + packageUrl;
                        }

                        self._deferredProjectInfo.resolve({
                            "reelUrl": reelUrl,
                            "packageUrl": packageUrl,
                            "componentUrls": componentUrls
                        });

                    });
                }).done();
            }

            return this._deferredProjectInfo.promise;
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
    componentsInPackage: {
        value: function (packageUrl) {

            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort))

            return backend.get("fs").invoke("normal", packageUrl + "/ui")
                .then(function (uiPath) {
                    return backend.get("fs").invoke("list", uiPath)
                        .then(function (listing) {
                            return listing.filter(function (entry) {
                                return !!entry.match(/\.reel$/);
                            }).map(function (reelEntry) {
                                return uiPath + "/" + reelEntry;
                            });
                        });
                });
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
            path = location.replace(/^\w+:\/\/\w+/m, "") + "/" + filename + ".html";
            content = template.exportToString();

            this.writeDataToFilePath(content, path, {flags: "w", charset: 'utf-8'});
        }
    },

    writeDataToFilePath: {
        value: function (data, path, flags) {

            if (!lumieres.nodePort) {
                // TODO improve error
                throw "No port provided for filesystem connection";
            }

            var backend = Connection(new WebSocket("ws://localhost:" + lumieres.nodePort));
            backend.get("fs").invoke("write", path, data, flags).done();
        }
    }
});
