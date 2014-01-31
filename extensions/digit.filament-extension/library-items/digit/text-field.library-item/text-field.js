/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.TextField = LibraryItem.specialize({

    constructor: {
        value: function TextFieldLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Text Field"
    },

    description: {
        value: "Displays single-line text that the user can edit and select."
    },

    iconUrl: {
        value: moduleLocation + "text-field.png"
    }

});
