/**
 @module native-menu
 @requires montage/core/core
 @requires montage/core/promise
 @requires montage/core/event/mutable-event
 @requires montage/core/event/event-manager
 */

var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    MenuItem = require("ui/native-menu/menu-item").MenuItem,
    defaultEventManager = require("montage/core/event/event-manager").defaultEventManager;

var getMainMenu = null;
var kListenerError = "'menuAction' listener must be installed on a component or the Application object";

var Menu = exports.Menu = Montage.create(Montage, {

    _itemsToInsert: {
        value: []
    },

    itemsToInsert: {
        set: function(newItems) {
            var thisRef = this;

            // Generate an identifier if not is specified
            for (var i in newItems) {
                var item = newItems[i];
                if (typeof item.identifier !== "string" || item.identifier.length == 0) {
                    item.identifier = item.title || (item.location ? (item.location.after || item.location.before) : "");
                    item.identifier = item.identifier.replace(/ /g, "");
                }
            }
            thisRef._itemsToInsert = thisRef._itemsToInsert.concat(newItems);
            if (!thisRef._fetchingMenu) {
                var itemsBeingInserted = thisRef._itemsToInsert.splice(0),
                    mainMenu = thisRef._items[0].menu;

                thisRef._insertItem(mainMenu, itemsBeingInserted, 0, function() {
                    thisRef._items = mainMenu.items;
                })
            }
        }
    },

    _items: {
        value: null
    },

    items: {
        get: function() {
            return this._items
        }
    },

    didCreate: {
        enumerable: false,
        value: function() {
            var thisRef = this;

            if (lumieres) {
                getMainMenu = Promise.nfbind(lumieres.getMainMenu);

                // Replace the lumieres MenuItem object by our own Montage Equivalent, and install our own action dispatcher
                if (lumieres.MenuItem === undefined) {
                    lumieres.MenuItem = window.MenuItem;
                    window.MenuItem = MenuItem;

                    Object.defineProperty(MenuItem, "doAction", {
                        value: lumieres.MenuItem.doAction
                    });

                    Object.defineProperty(MenuItem, "dispatchAction", {
                        value: function(menuItem) {
                            thisRef.dispatchAction(menuItem);
                        }
                    });
                }
                thisRef._fetchingMenu = true;
                getMainMenu().then(function(mainMenu) {
                    thisRef._items = mainMenu.items;
                    if (thisRef._itemsToInsert.length) {
                        var itemsBeingInserted = thisRef._itemsToInsert.splice(0);
                        thisRef._insertItem(mainMenu, itemsBeingInserted, 0, function() {
                            thisRef._items = mainMenu.items;
                        })
                    }
                }).done(function() {
                    delete thisRef._fetchingMenu;
                });
            } else {
                throw new Error("the Native Menu component can only be use in conjunction with Lumieres");
            }

            window.addEventListener("didBecomeKey", this);
        }
    },

    addEventListener: {
        value: function(type, listener, useCapture) {
            throw new Error("addEventListener not supported. " + kListenerError);
        }
    },

    removeEventListener: {
        value: function(type, listener, useCapture) {
            throw new Error("removeEventListener not supported. " + kListenerError);
        }
    },

    _deleteCallbackCount: {
        value: 0
    },

    resetMenu: {
        value: function(menu, callback) {
            var thisRef = this;

            var _reset = function(item) {
                if (item.isJavascriptOwned && item.menu) {
                    thisRef._deleteCallbackCount ++;
                    lumieres.MenuItem.deleteItem.call(item.menu, item, function() {
                        thisRef._deleteCallbackCount --;
                        if (thisRef._deleteCallbackCount == 0 && callback) {
                            callback();
                            thisRef._deleteCallbackCount --; // To prevent firing the callback more than once
                        }
                    });
                } else if (item.items) {
                    for (var i in item.items) {
                        _reset(item.items[i], callback);
                    }
                }
            };

            if (menu == undefined) {
                menu = thisRef._items[0].menu;
                if (menu) {
                    _reset(menu);
                }
            } else {
                _reset(menu);
            }

            // Fire the callback when there was no items to delete at all
            if (thisRef._deleteCallbackCount == 0 && callback) {
                callback();
            }
        }
    },

    _locationForPath: {
        value: function(mainMenu, path, isAfter) {
            var menu = mainMenu,
                index = null,
                paths = path.split("."),
                nbrPath = paths.length,
                i;

            var nativeItemAtIndex = function(menu, index) {
                var items = menu.items,
                    item,
                    i;

                for (i in menu.items) {
                    item = items[i];
                    if (item.isJavascriptOwned) {
                        continue;
                    }

                    if (-- index == 0) {
                        return { menu: item, index: parseInt(i, 10) };
                    }
                }

                return { menu: null, index: -1 };
            }

            // Path are relative to native menus, ignore all JS menus
            for (i = 0; i < nbrPath; i ++) {
                var location = nativeItemAtIndex(menu,  parseInt(paths[i], 10)),
                    nextMenu = location.menu;

                index = location.index;
                if (nextMenu) {
                    menu = nextMenu;
                } else {
                    isAfter = true;
                    index = menu.items.length - 1;
                    break;
                }
            }

            return {
                menu: menu !== mainMenu ? menu.menu : mainMenu,
                index: null ? null : isAfter ? index + 1 : index
            }
        }
    },

    _insertItem: {
        value: function(mainMenu, items, itemIndex, callback) {
            var thisRef = this,
                location,
                index,
                menu,
                item;

            if (itemIndex < items.length) {
                item = items[itemIndex];
                location = item.location;

                menu = mainMenu;
                index = null;

                if (typeof location == "object") {
                    if (location.before !== undefined) {
                        location = thisRef._locationForPath(mainMenu, location.before, false);
                        menu = location.menu;
                        index = location.index;
                    } else if (location.after !== undefined) {
                        location = thisRef._locationForPath(mainMenu, location.after, true);
                        menu = location.menu;
                        index = location.index;
                    }
                }

                lumieres.MenuItem.insertItem.call(menu, item, index, function() {
                    thisRef._insertItem(mainMenu, items, ++ itemIndex, callback);
                })
            } else if (callback) {
                callback(0, null);
            }
        }
    },

    handleDidBecomeKey: {
        value: function(event) {
            var thisRef = this;

            if (thisRef._items && thisRef._items.length !== 0) {
                getMainMenu().then(function(mainMenu) {
                    thisRef._items = mainMenu.items;
                }).done();
            }
        }
    },

    dispatchAction:{
        value: function(menuItem) {
            var event = new CustomEvent("menuAction", {
                                   detail: menuItem,
                                   bubbles: true,
                                   cancelable: true
                               }),
                target = document.activeElement,
                component = target.controller;

            while (component == null && target) {
               target = target.parentNode;
            }

            component = component || defaultEventManager.application;
            component.dispatchEvent(event);
        }
    },

    menuItemForIdentifier: {
        value: function(identifier) {
            var searchItemsTree = function(menu, identifier) {
                for (var i in menu.items) {
                    var item = menu.items[i];
                    if (item.identifier === identifier) {
                        return item;
                    } else {
                        if (item.items) {
                            item = searchItemsTree(item, identifier);
                            if (item) {
                                return item;
                            }
                        }
                    }
                }

                return undefined;
            }

            return searchItemsTree(this, identifier);
        }
    }
});

var _defaultMenu = null;
Montage.defineProperty(exports, "defaultMenu", {
    get: function() {
        if (!_defaultMenu) {
            _defaultMenu = Menu.create();
        }
        return _defaultMenu;
    }
});
