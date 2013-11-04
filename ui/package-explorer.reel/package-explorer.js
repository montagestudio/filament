var Component = require("montage/ui/component").Component;

var defaultMenu = require("adaptor/client/ui/native/menu").defaultMenu;
var MenuItem = require("adaptor/client/ui/native/menu-item").MenuItem;
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

            this._initMenuItem();
        }
    },

    _initMenuItem: {
        value: function () {
            var self = this;

            var viewMenu;
            var items = defaultMenu.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].title === "View") {
                    viewMenu = items[i];
                    break;
                }
            }

            var item = MenuItem.create();
            item.title = HIDE_MENU_TEXT;
            item.identifier = MENU_IDENTIFIER;
            item.keyEquivalent = MENU_KEY;
            viewMenu.insertItem(item)
            .then(function (item) {
                self._menuItem = item;
                application.addEventListener("menuAction", self, false);
            })
            .done();
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
        }
    },

    handlePreviewLinkClick: {
        value: function (event) {
            // stop the browser from following the link
            event.preventDefault();
            this.projectController.environmentBridge.openHttpUrl(this.previewController.previewUrl).done();
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
