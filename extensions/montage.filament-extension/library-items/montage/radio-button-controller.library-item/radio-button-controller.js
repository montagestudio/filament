/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.RadioButtonController = LibraryItem.specialize({

    constructor: {
        value: function RadioButtonControllerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "RadioButtonController"
    },

    description: {
        value: "Manages the state of radio buttons."
    },

    iconUrl: {
        value: moduleLocation + "radio-button-controller.png"
    }

});
