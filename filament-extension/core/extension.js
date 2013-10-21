var Target = require("montage/core/target").Target;

exports.Extension = Target.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

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
