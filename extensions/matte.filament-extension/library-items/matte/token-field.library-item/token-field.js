/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.TokenField = LibraryItem.specialize({

    constructor: {
        value: function TokenFieldLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Token Field"
    },

    iconUrl: {
        value: moduleLocation + "token-field.png"
    }

});
