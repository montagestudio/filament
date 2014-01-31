/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Text = LibraryItem.specialize({

    constructor: {
        value: function TextLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Text"
    },

    description: {
        value: "Provides functionality for adding styled, dynamic text."
    },

    iconUrl: {
        value: moduleLocation + "text.png"
    }

});
