/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Confirm = LibraryItem.specialize({

    constructor: {
        value: function ConfirmLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Confirm"
    },

    iconUrl: {
        value: moduleLocation + "confirm.png"
    }

});
