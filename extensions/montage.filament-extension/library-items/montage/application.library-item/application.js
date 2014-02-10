/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Application = LibraryItem.specialize({

    constructor: {
        value: function ApplicationLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Application"
    },

    description: {
        value: "A reference to the default application object."
    },

    iconUrl: {
        value: moduleLocation + "application.png"
    }

});
