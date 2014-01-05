var CoreExtension = require("filament-extension/core/extension").Extension;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {
            return this.installLibraryItems(projectController, "glTF-webgl-viewer").thenResolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            return this.uninstallLibraryItems(projectController, "glTF-webgl-viewer").thenResolve(this);
        }
    }

});

Extension.packageLocation = require.location;
