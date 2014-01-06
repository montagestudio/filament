/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Anchor = LibraryItem.specialize({

    constructor: {
        value: function AnchorLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Anchor"
    },

    iconUrl: {
        value: moduleLocation + "anchor.png"
    }

});
