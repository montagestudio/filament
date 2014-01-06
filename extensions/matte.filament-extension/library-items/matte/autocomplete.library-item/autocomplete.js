/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Autocomplete = LibraryItem.specialize({

    constructor: {
        value: function AutocompleteLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Autocomplete"
    },

    iconUrl: {
        value: moduleLocation + "autocomplete.png"
    }

});
