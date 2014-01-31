/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.ListItem = LibraryItem.specialize({

    constructor: {
        value: function ListItemLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "List Item"
    },

    description: {
        value: "Used for displaying individual list items."
    },

    iconUrl: {
        value: moduleLocation + "list-item.png"
    }

});
