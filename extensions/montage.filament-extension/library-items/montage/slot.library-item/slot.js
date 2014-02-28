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

    description: {
        value: "Serves as a placeholder for a planned component"
    },

    iconUrl: {
        value: moduleLocation + "slot.png"
    }

});
