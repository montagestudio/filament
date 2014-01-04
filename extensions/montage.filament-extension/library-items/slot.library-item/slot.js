/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Slot = LibraryItem.specialize({

    constructor: {
        value: function SlotLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Slot"
    },

    iconUrl: {
        value: moduleLocation + "slot.png"
    }

});
