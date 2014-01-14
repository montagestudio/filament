/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.InputRange = LibraryItem.specialize({

    constructor: {
        value: function InputRangeLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "InputRange"
    },

    iconUrl: {
        value: moduleLocation + "input-range.png"
    }

});
