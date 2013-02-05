var Montage = require("montage/core/core").Montage,
    Extension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    defaultMenu = require("filament/ui/native-menu/menu").defaultMenu,
    MenuItem = require("filament/ui/native-menu/menu-item").MenuItem;

/*global lumieres */

var Extension = exports.Extension = Montage.create(Extension, {

    name: {
        get: function () {
            //TODO read the name from the package or something
            return "Mop";
        }
    },

    toolsMenu: {
        value: null
    },

    mopMenu: {
        value: null
    },

    application: {
        value: null
    },

    projectController: {
        value: null
    },

    activate: {
        value: function (application, projectController) {
            var self = this;

            this.application = application;
            this.projectController = projectController;

            var toolsMenu = MenuItem.create();
            toolsMenu.identifier = "Tools";
            toolsMenu.title = "Tools";

            this.toolsMenu = defaultMenu.insertItem(toolsMenu, 5);
            this.mopMenu = this.toolsMenu.then(function (toolsMenu) {
                var mopItem = MenuItem.create();
                mopItem.title = "Mop";
                mopItem.identifier = "mop";
                return toolsMenu.insertItem(mopItem);
            });

            return this.mopMenu.then(function () {
                application.addEventListener("menuAction", self, false);
                return self;
            });

        }
    },

    deactivate: {
        value: function (application, projectController) {
            var self = this;

            return Promise.all([this.toolsMenu, this.mopMenu]).spread(function (toolsMenu, mopMenu) {
                return toolsMenu.removeItem(mopMenu).then(function () {
                    if (toolsMenu.items.length === 0) {
                        return defaultMenu.removeItem(toolsMenu);
                    }
                });
            }).then(function () {
                self.toolsMenu = null;
                self.mopMenu = null;
                self.application = null;
                self.projectController = null;
                return self;
            });
        }
    },

    optimize: {
        value: function () {
            var self = this,
                projectController = this.projectController,
                bridge = projectController.environmentBridge,
                mop = bridge.backend.get("mop");

            var slice = Array.prototype.slice;

            var location = bridge.convertBackendUrlToPath(projectController.packageUrl);
            var deferred = Promise.defer();

            mop.invoke("optimize", location, {
                out: {
                    status: Promise.master(function () {
                        deferred.notify(slice.call(arguments).join(" "));
                    })
                }
            }).then(deferred.resolve, function (err) {
                console.error(err.stack);
                deferred.reject(err);
            });

            this.dispatchEventNamed("asyncActivity", true, false, {
                promise: deferred.promise,
                title: "Mop",
                status: projectController.packageUrl
            });

            return deferred.promise;
        }
    },

    handleMenuAction: {
        value: function(event) {
            if (event.detail.identifier === "mop") {
                this.optimize();
            }
        }
    }
});

Extension.extensionRequire = require;
