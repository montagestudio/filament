var CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise;

var Extension = exports.Extension = CoreExtension.specialize({

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    activate: {
        value: function (application, projectController) {
            var self = this;

            return Promise.all([
                this.installLibraryItems(projectController, "montage"),
                this.installModuleIcons(projectController, "montage")
            ]).then(self);
        }
    },

    deactivate: {
        value: function (application, projectController) {
            var self = this;

            return Promise.all([
                this.uninstallLibraryItems(projectController, "montage"),
                this.uninstallModuleIcons(projectController, "montage")
            ]).then(self);
        }
    }

});

Extension.packageLocation = require.location;
