var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    Promise = require("montage/core/promise").Promise,
    qs = require("qs");

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    _deferredReelInfo: {
        value: null
    },

    reelInfo: {
        get: function () {

            if (!this._deferredReelInfo) {
                this._deferredReelInfo = Promise.defer();
            }

            var params = qs.parse(window.location.search.replace(/^\?/, "")),
                reelParam = params.file,
                reelUrl,
                self = this;

            if (reelParam && !reelParam.match(/fs:\/\(null\)/)) {
                reelUrl = reelParam;
            }

            this.findPackage(reelUrl.replace("fs:/", "")).then(function (packageUrl) {

                if (packageUrl) {
                    packageUrl = "fs:/" + packageUrl;
                }

                self._deferredReelInfo.resolve({"reelUrl": reelUrl, "packageUrl": packageUrl});
            });

            return this._deferredReelInfo.promise;
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
