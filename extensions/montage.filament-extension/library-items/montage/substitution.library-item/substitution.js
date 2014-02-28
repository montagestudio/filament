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
        value: "Selectively shows a subset of its content based upon a switch value"
    },

    iconUrl: {
        value: moduleLocation + "substitution.png"
    }

});
