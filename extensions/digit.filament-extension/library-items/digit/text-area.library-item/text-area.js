/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.TextArea = LibraryItem.specialize({

    constructor: {
        value: function TextAreaLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Text Area"
    },

    iconUrl: {
        value: moduleLocation + "text-area.png"
    }

});
