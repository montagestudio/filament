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

    iconUrl: {
        value: moduleLocation + "title.png"
    }

});
