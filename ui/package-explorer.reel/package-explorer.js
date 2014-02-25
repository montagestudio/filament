var Component = require("montage/ui/component").Component;

var menuItemExports,
    MenuItem;

try {
    menuItemExports = require("adaptor/client/core/menu-item");
} catch (e) {
    console.log("Environment did not provide a MenuItem");
}

if (menuItemExports) {
    MenuItem = menuItemExports.MenuItem;
}

var application = require("montage/core/application").application;

// TODO: localize
var HIDE_MENU_TEXT = "Hide Package Explorer";
var SHOW_MENU_TEXT = "Show Package Explorer";
var MENU_IDENTIFIER = "showHidePackageExplorer";
var MENU_KEY = "command+0";

exports.PackageExplorer = Component.specialize({

    constructor: {
        value: function PackageExplorer() {
            return this.super();
        }
    },

    enterDocument: {
        value: function () {
            // there is no action event built into the montage anchor.reel
            this.templateObjects.previewLink.element.identifier = "previewLink";
            this.templateObjects.previewLink.element.addEventListener("click", this, false);
            application.addPathChangeListener("mainMenu", this, "handleMenuAvailable");

            var self = this;
            this.addPathChangeListener("previewController.previewUrl", function () {
                self.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
            });

            window.addEventListener("keydown", this, true);
            window.addEventListener("keyup", this, true);
        }
    },

    optionPressed: {
        value: false
    },

    captureKeydown: {
        value: function(e) {
            var code = e.which;
            if (e.which === 18) {
                console.log('alt pressed');
                this.optionPressed = true;
                this.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                this.needsDraw = true;
            }
        }
    },

    captureKeyup: {
        value: function(e) {
            var code = e.which;
            if (e.which === 18) {
                console.log('alt un pressed');
                this.optionPressed = false;
                this.dispatchOwnPropertyChange("previewUrl", self.previewUrl);
                this.needsDraw = true;
            }
        }
    },

    previewUrl: {
        get: function() {
            var url = this.previewController.previewUrl;
            if (this.optionPressed) {
                url = url.replace(/^https:/, "http:");
            }
            console.log("previewURL is %s", url);
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
                    var item = MenuItem.create();
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
                this.templateObjects.previewLink.element.classList.add("PackageExplorer-previewButton--optionPressed");
            } else {
                this.templateObjects.previewLink.element.classList.remove("PackageExplorer-previewButton--optionPressed");
            }
        }
    },

    handlePreviewLinkClick: {
        value: function (event) {
            // stop the browser from following the link
            event.preventDefault();
            this.projectController.environmentBridge.openHttpUrl(this.previewUrl).done();
        }
    },

    handleAddFileButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addFile", true, true);
        }
    },

    handleAddModuleButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("addModule", true, true);
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
    }

});
