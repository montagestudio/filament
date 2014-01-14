/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.InputText = LibraryItem.specialize({

    constructor: {
        value: function InputTextLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "InputText"
    },

    iconUrl: {
        value: moduleLocation + "input-text.png"
    }

});
