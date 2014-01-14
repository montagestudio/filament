/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.InputNumber = LibraryItem.specialize({

    constructor: {
        value: function InputNumberLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "InputNumber"
    },

    iconUrl: {
        value: moduleLocation + "input-number.png"
    }

});
