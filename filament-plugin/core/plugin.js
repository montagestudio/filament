var Montage = require("montage/core/core").Montage;

exports.Plugin = Montage.create(Montage, {

    pluginRequire: {
        value: null
    },

    name: {
        get: function () {
            return this.pluginRequire.packageDescription.name.replace(/\W*filament-plugin$/, "");
        }
    },

    version: {
        get: function () {
            return this.pluginRequire.packageDescription.version;
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