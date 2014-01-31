/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Slider = LibraryItem.specialize({

    constructor: {
        value: function SliderLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Slider"
    },

    description: {
        value: "Displays a range of values for a feature in the application."
    },

    iconUrl: {
        value: moduleLocation + "slider.png"
    }

});
