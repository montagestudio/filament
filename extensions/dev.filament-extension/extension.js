var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise;

var Extension = exports.Extension = Montage.create(CoreExtension, {

    supportsFilamentVersion: {
        value: function () {
            return true;
        }
    },

    events: {
        distinct: true,
        value: ["willOpenPackage", "didOpenPackage", "canLoadProject",
            "willActivateExtension", "willDeactivateExtension",
            "willExitDocument", "willLoadDocument", "didLoadDocument", "willEnterDocument", "didEnterDocument", "willCloseDocument",
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

            // Log the amount of time an async activity takes to run
            application.addEventListener("asyncActivity", this, false);

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

    handleAsyncActivity: {
        value: function (event) {
            var title = "Async activity " + event.detail.title, promise = event.detail.promise;
            console.time(title);
            promise.finally(function () {
                console.timeEnd(title);
            });
        }
    },

    handleEvent: {
        value: function (evt) {
            console.log("Lumieres Event", evt.type, evt.detail);
        }
    }

});

Extension.extensionRequire = require;
