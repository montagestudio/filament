/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Select = LibraryItem.specialize({

    constructor: {
        value: function SelectLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Select"
    },

    iconUrl: {
        value: moduleLocation + "select.png"
    }

});
