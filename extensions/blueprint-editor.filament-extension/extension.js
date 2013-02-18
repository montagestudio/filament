var Montage = require("montage/core/core").Montage,
    CoreExtension = require("filament-extension/core/extension").Extension,
    defaultMenu = require("filament/ui/native-menu/menu").defaultMenu,
    MenuItem = require("filament/ui/native-menu/menu-item").MenuItem,
    Promise = require("montage/core/promise").Promise,
    BlueprintEditor = require("ui/blueprint-editor.reel").BlueprintEditor;
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
            viewController.registerEditorTypeForFileTypeMatcher(BlueprintEditor, this.editorFileMatchFunction);
            var self = this;

            this.application = application;
            this.projectController = projectController;

            application.addEventListener("didEnterDocument", self, false);
            application.addEventListener("willExitDocument", self, false);

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
            viewController.unregisterEditorTypeForFileTypeMatcher(this.editorFileMatchFunction);
            var self = this;

            application.removeEventListener("didEnterDocument", self, false);
            application.removeEventListener("willExitDocument", self, false);

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
                this.dispatchEventNamed("openFile", true, true, {
                    fileUrl:location + "/" + filenameMatch[1] + Blueprint.FileExtension
                });
            }
        }
    },

    handleDidEnterDocument:{
        value:function (evt) {
            var location = this.projectController.currentDocument.fileUrl;
            var filenameMatch = location.match(/.+\/(.+)\.reel/);
            var menuEnabled = (filenameMatch && filenameMatch[1]);
            console.log("handleDidEnterDocument enable " + menuEnabled, evt.type, evt.detail);
            this.blueprintMenu.then(function (menuItem) {
                if (filenameMatch && filenameMatch[1]) {
                    menuItem.enabled = true;
                } else {
                    menuItem.enabled = false;
                }
            });
        }
    },

    handleWillExitDocument:{
        value: function (evt) {
            this.blueprintMenu.then(function (menuItem) {
                menuItem.enabled = false;
            });
        }
    }

});
Extension.extensionRequire = require;
