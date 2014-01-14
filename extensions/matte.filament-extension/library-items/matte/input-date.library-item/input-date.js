/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.InputDate = LibraryItem.specialize({

    constructor: {
        value: function InputDateLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "InputDate"
    },

    iconUrl: {
        value: moduleLocation + "input-date.png"
    }

});
