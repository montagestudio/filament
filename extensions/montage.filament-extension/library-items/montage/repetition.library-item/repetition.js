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

    description: {
        value: "Produces a repeating group of elements based on an array of values. Use as a building block to repeat any number of user interface components."
    },

    iconUrl: {
        value: moduleLocation + "repetition.png"
    }

});
