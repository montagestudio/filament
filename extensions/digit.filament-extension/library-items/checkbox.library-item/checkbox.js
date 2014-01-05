/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Checkbox = LibraryItem.specialize({

    constructor: {
        value: function CheckboxLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Checkbox"
    },

    iconUrl: {
        value: moduleLocation + "checkbox.png"
    }

});
