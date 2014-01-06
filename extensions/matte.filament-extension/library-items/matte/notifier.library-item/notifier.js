/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Notifier = LibraryItem.specialize({

    constructor: {
        value: function NotifierLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Notifier"
    },

    iconUrl: {
        value: moduleLocation + "notifier.png"
    }

});
