var CoreExtension = require("filament-extension/core/extension").Extension;

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {
            return this.installLibraryItems(projectController, "digit").thenResolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            return this.uninstallLibraryItems(projectController, "digit").thenResolve(this);
        }
    }

});

Extension.packageLocation = require.location;
