/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.ToggleButton = LibraryItem.specialize({

    constructor: {
        value: function ToggleButtonLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Toggle Button"
    },

    iconUrl: {
        value: moduleLocation + "toggle-button.png"
    }

});
