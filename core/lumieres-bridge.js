var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    ComponentProject = require("palette/core/component-project.js").ComponentProject,
    Promise = require("montage/core/promise").Promise,
    Connection = require("q-comm");

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

            //TODO change name of output file
            var path = location.replace(/^\w+:\/\/\w+/m, "") + "lumiere_save.html",
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
