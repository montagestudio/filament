var Montage = require("montage/core/core").Montage;

exports.AssetCompiler = Montage.create(Montage, {

    assetCompilerRequire: {
        value: null
    },

    name: {
        get: function () {
            return this.assetCompilerRequire.packageDescription.name.replace(/\W*filament-asset-compiler$/, "");
        }
    },

    version: {
        get: function () {
            return this.assetCompilerRequire.packageDescription.version;
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
