var Montage = require("montage").Montage;

var Menu = Montage.create(Montage, {

    menuItems: {
        value: null
    },

    menuItemForIdentifier: {
        value: function (identifier) {
            return this.menuItems[identifier];
        }
    }

});

exports.menuMock = function (options) {
    var menu = Menu.create();
    menu.menuItems = options.menuItems || {};

    return menu;
};



