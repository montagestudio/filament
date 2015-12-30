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
            var self = this;

            return Promise.all([
                this.installLibraryItems(projectController, "matte"),
                this.installModuleIcons(projectController, "matte")
            ]).then(function() { return self; });
        }
    },

    deactivate: {
        value: function (application, projectController) {
            var self = this;

            return Promise.all([
                this.uninstallLibraryItems(projectController, "matte"),
                this.uninstallModuleIcons(projectController, "matte")
            ]).then(function() { return self; });
        }
    }

});

Extension.packageLocation = require.location;
