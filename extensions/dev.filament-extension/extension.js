var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise;

var Extension = exports.Extension = Montage.create(Extension, {

    supportsFilamentVersion: {
        value: function () {
            return true;
        }
    },

    events: {
        distinct: true,
        value: ["willOpenPackage", "didOpenPackage", "canLoadProject",
            "willActivateExtension", "willDeactivateExtension",
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

Extension.extensionRequire = require;
