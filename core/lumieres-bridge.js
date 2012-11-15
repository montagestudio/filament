var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    ComponentProject = require("palette/core/component-project.js").ComponentProject,
    Promise = require("montage/core/promise").Promise;

exports.LumiereBridge = Montage.create(EnvironmentBridge, {

    _project: {
        value: null
    },

    project: {
        get: function () {

            if (!this._project) {
                var reelUrl = window.location.search.replace(/\??file=/, ""),
                    project;

                project = ComponentProject.create();
                project.reelUrl = reelUrl;

                console.log("Lumiere", reelUrl)

                this._project = project;
            }

            return this._project;
        }
    }
});
