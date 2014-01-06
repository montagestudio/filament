/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Scroller = LibraryItem.specialize({

    constructor: {
        value: function ScrollerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Scroller"
    },

    iconUrl: {
        value: moduleLocation + "scroller.png"
    }

});
