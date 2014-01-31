/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Title = LibraryItem.specialize({

    constructor: {
        value: function TitleLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Title"
    },

    description: {
        value: "Provides functionality for adding a block element with a bold weight."
    },

    iconUrl: {
        value: moduleLocation + "title.png"
    }

});
