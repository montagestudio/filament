/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.RadioButton = LibraryItem.specialize({

    constructor: {
        value: function RadioButtonLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Radio Button"
    },

    iconUrl: {
        value: moduleLocation + "radio-button.png"
    }

});