var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    defaultMenu = require("filament/ui/native-menu/menu").defaultMenu,
    MenuItem = require("filament/ui/native-menu/menu-item").MenuItem;

/*global lumieres */

var PARENT_MENU = "Tools";

var Extension = exports.Extension = CoreExtension.specialize( {

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    name: {
        get:function () {
            //TODO read the name from the package or something
            return "Mop";
        }
    },

    parentMenu: {
        value:null
    },

    mopMenu: {
        value:null
    },

    application: {
        value:null
    },

    projectController: {
        value:null
    },

    activate: {
        value: function (application, projectController) {
            var self = this;

            this.application = application;
            this.projectController = projectController;

            var existingMenu = defaultMenu.menuItemForIdentifier(PARENT_MENU);
            if (existingMenu) {
                this.parentMenu = Promise.resolve(existingMenu);
            } else {
                var parentMenu = MenuItem.create();
                parentMenu.identifier = PARENT_MENU.toLowerCase();
                parentMenu.title = PARENT_MENU; // This should be localized
                this.parentMenu = defaultMenu.insertItem(parentMenu, 5);
            }

            this.mopMenu = this.parentMenu.then(function (parentMenu) {
                var mopItem = MenuItem.create();
                mopItem.title = "Mop"; // This should be localized
                mopItem.identifier = "mop";
                return parentMenu.insertItem(mopItem);
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

            return Promise.all([this.parentMenu, this.mopMenu]).spread(function (parentMenu, mopMenu) {
                return parentMenu.removeItem(mopMenu).then(function () {
                    if (parentMenu.items.length === 0) {
                        return defaultMenu.removeItem(parentMenu);
                    }
                });
            }).then(function () {
                self.parentMenu = null;
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
        value: function (event) {
            if (event.detail.identifier === "mop") {
                this.optimize();
            }
        }
    }
});