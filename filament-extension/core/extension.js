var Montage = require("montage/core/core").Montage;

exports.Extension = Montage.create(Montage, {

    extensionRequire: {
        value: null
    },

    name: {
        get: function () {
            return this.extensionRequire.packageDescription.name.replace(/\W*filament-extension$/, "");
        }
    },

    version: {
        get: function () {
            return this.extensionRequire.packageDescription.version;
        }
    },

    supportsFilamentVersion: {
        value: function (version) {
            return false;
        }
    },

    supportsModuleVersion: {
        value: function (moduleId, version) {
            return false;
        }
    },

    activate: {
        value: null
    },

    deactivate: {
        value: null
    }

});
