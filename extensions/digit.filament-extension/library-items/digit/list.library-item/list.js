/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.List = LibraryItem.specialize({

    constructor: {
        value: function ListLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "List"
    },

    description: {
        value: "Configured for adding multi-item lists."
    },

    iconUrl: {
        value: moduleLocation + "list.png"
    }

});
