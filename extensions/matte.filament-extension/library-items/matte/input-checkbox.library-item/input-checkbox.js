/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.InputCheckbox = LibraryItem.specialize({

    constructor: {
        value: function InputCheckboxLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "InputCheckbox"
    },

    iconUrl: {
        value: moduleLocation + "input-checkbox.png"
    }

});
