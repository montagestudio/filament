/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Button = LibraryItem.specialize({

    constructor: {
        value: function ButtonLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Button"
    },

    iconUrl: {
        value: moduleLocation + "button.png"
    }

});
