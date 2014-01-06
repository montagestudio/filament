/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.View = LibraryItem.specialize({

    constructor: {
        value: function ColladaViewLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Collada View"
    },

    iconUrl: {
        value: moduleLocation + "view.png"
    }

});
