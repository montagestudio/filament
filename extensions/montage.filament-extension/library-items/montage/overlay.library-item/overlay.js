/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Overlay = LibraryItem.specialize({

    constructor: {
        value: function OverlayLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Overlay"
    },

    description: {
        value: "Positions content over a page"
    },

    iconUrl: {
        value: moduleLocation + "overlay.png"
    }

});
