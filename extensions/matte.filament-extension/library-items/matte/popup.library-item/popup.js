/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Popup = LibraryItem.specialize({

    constructor: {
        value: function PopupLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Popup"
    },

    iconUrl: {
        value: moduleLocation + "popup.png"
    }

});
