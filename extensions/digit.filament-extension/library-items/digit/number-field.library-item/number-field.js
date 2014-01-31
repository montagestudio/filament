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

    description: {
        value: "Displays numbers that the user can select, edit, or increase or decrease using the spinner controls."
    },

    iconUrl: {
        value: moduleLocation + "number-field.png"
    }

});
