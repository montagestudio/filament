/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.TextSlider = LibraryItem.specialize({

    constructor: {
        value: function TextSliderLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Text Slider"
    },

    iconUrl: {
        value: moduleLocation + "text-slider.png"
    }

});
