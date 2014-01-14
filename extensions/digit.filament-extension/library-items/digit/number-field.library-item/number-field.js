/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.NumberField = LibraryItem.specialize({

    constructor: {
        value: function NumberFieldLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Number Field"
    },

    iconUrl: {
        value: moduleLocation + "number-field.png"
    }

});
