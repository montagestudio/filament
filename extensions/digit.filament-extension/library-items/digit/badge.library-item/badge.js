/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Badge = LibraryItem.specialize({

    constructor: {
        value: function BadgeLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Badge"
    },

    iconUrl: {
        value: moduleLocation + "badge.png"
    }

});
