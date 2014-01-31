/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Substitution = LibraryItem.specialize({

    constructor: {
        value: function SubstitutionLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Substitution"
    },

    description: {
        value: "Handles a group of elements, but shows only one element at a time. Use as a building block to reveal any number of user interface components one group at a time."
    },

    iconUrl: {
        value: moduleLocation + "substitution.png"
    }

});
