var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    Connection = require("q-connection"),
    qs = require("qs");

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    reelUrlInfo: {
        get: function () {

            var params = qs.parse(window.location.search.replace(/^\?/, "")),
                reelParam = params.file,
                reelUrl;

            if (reelParam && !reelParam.match(/fs:\/\(null\)/)) {
                reelUrl = reelParam;
            }

            return {"reelUrl": reelUrl};
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
