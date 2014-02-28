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
        value: "Manages a collection of objects"
    },

    iconUrl: {
        value: moduleLocation + "range-controller.png"
    }

});
