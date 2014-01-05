var CoreExtension = require("filament-extension/core/extension").Extension;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {
            return this.installLibraryItems(projectController, "matte").thenResolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            return this.uninstallLibraryItems(projectController, "matte").thenResolve(this);
        }
    }

});

Extension.packageLocation = require.location;
