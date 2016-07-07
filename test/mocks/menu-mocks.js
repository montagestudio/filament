var Montage = require("montage").Montage;

var Menu = Montage.specialize({

    menuItems: {
        value: null
    },

    menuItemForIdentifier: {
        value: function (identifier) {
            return this.menuItems[identifier];
        }
    }

});

var MenuItem = Montage.specialize({

});

exports.menuMock = function (options) {
    var menu = new Menu();
    options = options || {};
    menu.menuItems = options.menuItems || {};

    return menu;
};

exports.menuItemMock = function(options) {
    var menuItem = new MenuItem();

    return menuItem;
};
