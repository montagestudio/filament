/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Repetition = LibraryItem.specialize({

    constructor: {
        value: function RepetitionLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Repetition"
    },

    iconUrl: {
        value: moduleLocation + "repetition.png"
    }

});
