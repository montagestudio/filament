/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.ToggleSwitch = LibraryItem.specialize({

    constructor: {
        value: function ToggleSwitchLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Toggle Switch"
    },

    iconUrl: {
        value: moduleLocation + "toggle-switch.png"
    }

});
