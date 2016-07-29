var Component = require("montage/ui/component").Component,
    Url = require("core/url"),
    menuItemExports = require("core/menu-item"),
    MenuItem = menuItemExports.MenuItem,
    application = require("montage/core/application").application,
    MenuModule = require("core/menu"),
    // TODO: localize
    HIDE_MENU_TEXT = "Hide Package Explorer",
    SHOW_MENU_TEXT = "Show Package Explorer",
    MENU_IDENTIFIER = "showHidePackageExplorer",
    MENU_KEY = "command+0";

exports.PackageExplorer = Component.specialize({

    fileList: {
        value: null
    },

    constructor: {
        value: function PackageExplorer() {
            return this.super();
        }
    },

    didBecomeActiveTarget: {
        value: function () {
            this.classList.add("activeTarget");
        }
    },

    surrendersActiveTarget: {
        value: function () {
            this.classList.remove("activeTarget");
            return true;
        }
    },

    acceptsActiveTarget: {
        value: true
    },

    enterDocument: {
        value: function () {
            var self = this;

            // there is no action event built into the montage anchor.reel
            this.templateObjects.previewLink.element.identifier = "previewLink";
            this.templateObjects.previewLink.element.addEventListener("click", this, false);

            application.addPathChangeListener("mainMenu", this, "handleMenuAvailable");

            this.addBeforePathChangeListener("previewController.previewUrl", function () {
                self.dispatchBeforeOwnPropertyChange("previewUrl", self.previewUrl);
            });

            this.addPathChangeListener("previewController.previewUrl", function () {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });

            window.addEventListener("keydown", this, true);
            window.addEventListener("keyup", this, true);

            // contextualMenu
            this.addEventListener("contextualMenuValidate", this, false);
            this.addEventListener("contextualMenuAction", this, false);
        }
    },

    _contextualMenu: {
        value: null
    },

    _createContextualMenu: {
        value: function () {
            var newFolderItem,
                newComponentItem,
                newModuleItem,
                newFileItem,
                menu = new MenuModule.Menu();
            newFolderItem = MenuModule.makeMenuItem("New Folder…", "newDirectory", true, "");
            newComponentItem = MenuModule.makeMenuItem("New Component…", "newComponent", true, "");
            newModuleItem = MenuModule.makeMenuItem("New Module…", "newModule", true, "");
            newFileItem = MenuModule.makeMenuItem("New File…", "newFile", true, "");

            menu.insertItem(newFolderItem);
            menu.insertItem(newComponentItem);
            menu.insertItem(newModuleItem);
            menu.insertItem(newFileItem);

            return menu;
        }
    },

    contextualMenu: {
        get: function () {
            if (this._contextualMenu) {
                return this._contextualMenu;
            }
            var menu = this._createContextualMenu();
            this._contextualMenu = menu;

            return this._contextualMenu;
        }
    },

    handleContextualMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "delete":
                evt.stop();
                menuItem.enabled = true;
                break;
            }

        }
    },

    handleContextualMenuAction: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = menuItem.identifier;

            switch (identifier) {
            case "newDirectory":
                this.dispatchEventNamed("addDirectory", true, true, {path: "/"});
                break;

            case "newComponent":
                this.dispatchEventNamed("addFile", true, true, {path: "/"});
                break;

            case "newModule":
                this.dispatchEventNamed("addModule", true, true, {path: "/"});
                break;

            case "newFile":
                this.dispatchEventNamed("newFile", true, true, {path: "/"});
                break;
            }
        }
    },

    optionPressed: {
        value: false
    },

    captureKeydown: {
        value: function(e) {
            var code = e.which;
            if (code === 18) {
                this.dispatchBeforeOwnPropertyChange("previewUrl", this.previewUrl);
                this.optionPressed = true;
                this.dispatchOwnPropertyChange("previewUrl", this.previewUrl);
                this.needsDraw = true;
            }
        }
    },

    captureKeyup: {
        value: function(e) {
            var code = e.which;
            if (code === 18) {
                this.dispatchBeforeOwnPropertyChange("previewUrl", this.previewUrl);
                this.optionPressed = false;
                this.dispatchOwnPropertyChange("previewUrl", this.previewUrl);
                this.needsDraw = true;
            }
        }
    },

    previewUrl: {
        get: function() {
            var url = this.previewController.previewUrl;
            if (url && this.optionPressed) {
                var urlObject = Url.parse(url);
                if (urlObject.protocol === "http:") {
                    urlObject.protocol = "https:";
                } else {
                    urlObject.protocol = "http:";
                }
                url = Url.format(urlObject);
            }
            return url;
        }
    },

    handleMenuAvailable: {
        value: function (value, path, object) {
            if (!value) {
                return;
            }
            this._initMenuItem();
        }
    },

    _initMenuItem: {
        value: function () {

            if (!MenuItem) {
                return;
            }

            var mainMenu = application.mainMenu,
                self = this,
                viewMenu;

            if (mainMenu) {
                viewMenu = application.mainMenu.menuItemForIdentifier("View");

                if (viewMenu) {
                    var item = new MenuItem();
                    item.title = HIDE_MENU_TEXT;
                    item.identifier = MENU_IDENTIFIER;
                    item.keyEquivalent = MENU_KEY;
                    viewMenu.insertItem(item)
                    .then(function (item) {
                        self._menuItem = item;
                        application.addEventListener("menuAction", self, false);
                    }).done();
                }
            }
        }
    },

    _menuItem: {
        value: null
    },

    _isShown: {
        value: true
    },
    isShown: {
        get: function() {
            return this._isShown;
        },
        set: function(value) {
            if (this._isShown === value) {
                return;
            }
            this._isShown = value;
            this.needsDraw = true;
        }
    },

    projectController: {
        value: null
    },

    previewController: {
        value: null
    },

    fileTreeController: {
        value: null
    },

    packageDescription: {
        value: null
    },

    files: {
        value: null
    },

    draw: {
        value: function () {
            if (this._isShown) {
                this.element.style.display = "";
            } else {
                this.element.style.display = "none";
            }
            if (this.optionPressed) {
                this.templateObjects.previewLink.element.classList.add("PackageExplorer-previewButton--altProtocol");
            } else {
                this.templateObjects.previewLink.element.classList.remove("PackageExplorer-previewButton--altProtocol");
            }
        }
    },

    handlePreviewLinkClick: {
        value: function (event) {
            // stop the browser from following the link
            event.preventDefault();

            var url = this.previewUrl;
            setTimeout(function() {
                this.projectController.environmentBridge.openHttpUrl(url).done();
                this.optionPressed = false;
                this.needsDraw = true;
            }.bind(this), 1);

        }
    },

    handleMenuAction: {
        value: function (event) {
            if (event.detail.identifier !== MENU_IDENTIFIER) {
                return;
            }

            this.isShown = !this.isShown;
            this._menuItem.title = this.isShown ? HIDE_MENU_TEXT : SHOW_MENU_TEXT;
        }
    },

    handleAddComponentButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addFile", true, true);
        }
    }

});
