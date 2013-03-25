var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    defaultMenu = require("filament/ui/native-menu/menu").defaultMenu,
    MenuItem = require("filament/ui/native-menu/menu-item").MenuItem,
    Promise = require("montage/core/promise").Promise,
    BlueprintDocument = require("core/blueprint-document").BlueprintDocument;
var Blueprint = require("montage/core/meta/blueprint").Blueprint;


var PARENT_MENU = "Tools";

var Extension = exports.Extension = Montage.create(CoreExtension, {

    editorFileMatchFunction:{
        enumerable:false,
        value:function (fileUrl) {
            return (/blueprint\.json\/?$/).test(fileUrl);
        }
    },

    parentMenu:{
        value:null
    },

    blueprintMenu:{
        value:null
    },

    application:{
        value:null
    },

    projectController:{
        value:null
    },

    activate:{
        value:function (application, projectController, viewController) {
            projectController.registerUrlMatcherForDocumentType(this.editorFileMatchFunction, BlueprintDocument);
            var self = this;

            this.application = application;
            this.projectController = projectController;

            application.addEventListener("didOpenDocument", self, false);
            application.addEventListener("willCloseDocument", self, false);

            var existingMenu = defaultMenu.menuItemForIdentifier(PARENT_MENU);
            if (existingMenu) {
                this.parentMenu = Promise.resolve(existingMenu);
            } else {
                var parentMenu = MenuItem.create();
                parentMenu.identifier = PARENT_MENU.toLowerCase();
                parentMenu.title = PARENT_MENU; // This should be localized
                this.parentMenu = defaultMenu.insertItem(parentMenu, 5);
            }

            this.blueprintMenu = this.parentMenu.then(function (parentMenu) {
                var blueprintItem = MenuItem.create();
                blueprintItem.identifier = "blueprint";
                blueprintItem.title = "Add Blueprint"; // This should be localized
                return parentMenu.insertItem(blueprintItem);
            });

            return this.blueprintMenu.then(function (menuItem) {
                application.addEventListener("menuAction", self, false);
                menuItem.enabled = false;
                return self;
            });
        }
    },

    deactivate:{
        value:function (application, projectController, viewController) {
            projectController.unregisterUrlMatcherForDocumentType(this.editorFileMatchFunction, BlueprintDocument);
            var self = this;

            application.removeEventListener("didOpenDocument", self, false);
            application.removeEventListener("willCloseDocument", self, false);

            return Promise.all([this.parentMenu, this.blueprintMenu]).spread(function (parentMenu, blueprintMenu) {
                return parentMenu.removeItem(blueprintMenu).then(function () {
                    if (parentMenu.items.length === 0) {
                        return defaultMenu.removeItem(parentMenu);
                    }
                });
            }).then(function () {
                    self.parentMenu = null;
                    self.blueprintMenu = null;
                    self.application = null;
                    self.projectController = null;
                    return self;
                });
        }
    },

    handleMenuAction:{
        value:function (event) {
            if (event.detail.identifier === "blueprint") {
                if (!this.projectController.currentDocument) {
                    return;
                }
                var location = this.projectController.currentDocument.fileUrl;
                var filenameMatch = location.match(/.+\/(.+)\.reel/);
                if (!(filenameMatch && filenameMatch[1])) {
                    console.log("The current version only supports adding blueprint to reels.", location);
                    return;
                }
                this.dispatchEventNamed("openUrl", true, true,
                    location + "/" + filenameMatch[1] + Blueprint.FileExtension
                );
            }
        }
    },

    handleDidOpenDocument:{
        value:function (evt) {
            var location = evt.detail.document.fileUrl;
            var filenameMatch = location.match(/.+\/(.+)\.reel/);
            this.blueprintMenu.then(function (menuItem) {
                if (filenameMatch && filenameMatch[1]) {
                    menuItem.enabled = true;
                } else {
                    menuItem.enabled = false;
                }
            });
        }
    },

    handleWillCloseDocument:{
        value: function (evt) {
            this.blueprintMenu.then(function (menuItem) {
                menuItem.enabled = false;
            });
        }
    }

});
Extension.extensionRequire = require;
