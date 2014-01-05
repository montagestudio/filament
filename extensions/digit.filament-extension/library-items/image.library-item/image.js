/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Image = LibraryItem.specialize({

    constructor: {
        value: function ImageLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Image"
    },

    iconUrl: {
        value: moduleLocation + "image.png"
    }

});
