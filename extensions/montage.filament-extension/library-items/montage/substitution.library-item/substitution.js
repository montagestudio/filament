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

    iconUrl: {
        value: moduleLocation + "substitution.png"
    }

});
