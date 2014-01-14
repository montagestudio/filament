/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Progress = LibraryItem.specialize({

    constructor: {
        value: function ProgressLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Progress"
    },

    iconUrl: {
        value: moduleLocation + "progress.png"
    }

});
