var Montage = require("montage/core/core").Montage,
    Plugin = require("filament-plugin/core/plugin").Plugin,
    Promise = require("montage/core/promise").Promise,
    defaultMenu = require("filament/ui/native-menu/menu").defaultMenu,
    MenuItem = require("filament/ui/native-menu/menu-item").MenuItem;

var FILE_PROTOCOL = "file://";

/*global lumieres */

var Plugin = exports.Plugin = Montage.create(Plugin, {

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
                bridge = projectController.environmentBridge;

            this.mop = bridge.backend.get("mop");

            var location = FILE_PROTOCOL + bridge.convertBackendUrlToPath(projectController.packageUrl);
            var buildLocation = FILE_PROTOCOL + bridge.convertBackendUrlToPath(projectController.packageUrl + "/builds");

            var promise = this.mop.invoke("build", location, {
                buildLocation: buildLocation,
                minify: true,
                lint: 0,
                noCss: true,
                delimiter: "@",
                overlays: ["browser"],
                production: true,
                // TODO move this to promise progress notifications when
                // available over Q-Connection
                progress: Promise.master(function (progress) {
                    console.log(progress);
                })
            }).then(function (result) {
                console.log("Done mopping:", result);
                return result;
            }, function (err) {
                console.error(err.stack);
                throw err;
            });

            this.dispatchEventNamed("asyncTask", true, false, {
                promise: promise,
                title: "Mop",
                info: projectController.packageUrl
            });

            return promise;
        }
    },

    handleMenuAction: {
        value: function(event) {
            if (event.detail.identifier === "mop") {
                console.log("mop menu action");
                this.optimize();
            }
        }
    }
});

Plugin.pluginRequire = require;
