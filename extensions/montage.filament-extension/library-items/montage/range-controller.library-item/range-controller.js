/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.RangeController = LibraryItem.specialize({

    constructor: {
        value: function RangeControllerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "RangeController"
    },

    description: {
        value: "Manages the selection and visible portion of given content, typically for a repeating group of elements."
    },

    iconUrl: {
        value: moduleLocation + "range-controller.png"
    }

});
