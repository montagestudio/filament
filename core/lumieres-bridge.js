var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    ComponentProject = require("palette/core/component-project.js").ComponentProject,
    Promise = require("montage/core/promise").Promise,
    Connection = require("q-connection");

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    _project: {
        value: null
    },

    project: {
        get: function () {

            if (!this._project) {
                var reelUrl = window.location.search.replace(/\??file=/, ""),
                    project;

                if (reelUrl && !reelUrl.match(/fs:\/\(null\)/)) {
                    project = ComponentProject.create();
                    project.reelUrl = reelUrl;

                    this._project = project;
                }
            }

            return this._project;
        }
    },

    save: {
        value: function (template, location) {
            EnvironmentBridge.save.apply(this, arguments);

            //TODO I think I've made this regex many times...and probably differently
            var filenameMatch = location.match(/.+\/(.+)\.reel/),
                filename,
                path,
                content;

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
