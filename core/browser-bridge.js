var Montage = require("montage/core/core").Montage,
    EnvironmentBridge = require("core/environment-bridge").EnvironmentBridge,
    ComponentProject = require("palette/core/component-project.js").ComponentProject;

exports.BrowserBridge = Montage.create(EnvironmentBridge, {

    _project: {
        value: null
    },

    project: {
        get: function () {
            if (!this._project) {

                var reelUrl = require.getPackage({name: "palette"}).location + "templates/component.reel",
                    project;

                project = ComponentProject.create();
                project.reelUrl = reelUrl;
                this._project = project;
            }

            return this._project;
        }
    }

});
