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
                this.installLibraryItems(projectController, "digit"),
                this.installModuleIcons(projectController, "digit")
            ]).thenResolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            return Promise.all([
                this.uninstallLibraryItems(projectController, "digit"),
                this.uninstallModuleIcons(projectController, "digit")
            ]).thenResolve(this);
        }
    }

});

Extension.packageLocation = require.location;
