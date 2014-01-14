/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Material = LibraryItem.specialize({

    constructor: {
        value: function MaterialLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Material"
    },

    iconUrl: {
        value: moduleLocation + "material.png"
    }

});
