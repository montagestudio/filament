/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Alert = LibraryItem.specialize({

    constructor: {
        value: function AlertLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Alert"
    },

    iconUrl: {
        value: moduleLocation + "alert.png"
    }

});
