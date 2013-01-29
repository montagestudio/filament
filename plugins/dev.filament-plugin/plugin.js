var Montage = require("montage/core/core").Montage,
    Plugin = require("filament-plugin/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise;

var Plugin = exports.Plugin = Montage.create(Plugin, {

    supportsFilamentVersion: {
        value: function () {
            return true;
        }
    },

    events: {
        distinct: true,
        value: ["willOpenPackage", "didOpenPackage", "canLoadProject",
            "willActivatePlugin", "willDeactivatePlugin",
            "willExitDocument", "didLoadDocument", "didEnterDocument",
            "fileSystemChange",
            "willSave",
            "didLaunchPreview", "didRefreshPreview", "didUnregisterPreview"]
    },

    activate: {
        value: function (application) {
            var self = this;
            this.events.forEach(function (eventType) {
                application.addEventListener(eventType, self, false);
            });

            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application) {
            var self = this;
            this.events.forEach(function (eventType) {
                application.removeEventListener(eventType, self, false);
            });

            return Promise.resolve(this);
        }
    },

    handleEvent: {
        value: function (evt) {
            console.log("Lumieres Event", evt.type, evt.detail);
        }
    }

});

Plugin.pluginRequire = require;