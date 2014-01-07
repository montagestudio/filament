var CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {
            return Promise.all([
                this.installLibraryItems(projectController, "glTF-webgl-viewer"),
                this.installModuleIcons(projectController, "glTF-webgl-viewer")
            ]).thenResolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            return Promise.all([
                this.uninstallLibraryItems(projectController, "glTF-webgl-viewer"),
                this.uninstallModuleIcons(projectController, "glTF-webgl-viewer")
            ]).thenResolve(this);
        }
    }

});

Extension.packageLocation = require.location;
