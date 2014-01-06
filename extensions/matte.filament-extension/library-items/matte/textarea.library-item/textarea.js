/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Textarea = LibraryItem.specialize({

    constructor: {
        value: function TextareaLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Textarea"
    },

    iconUrl: {
        value: moduleLocation + "textarea.png"
    }

});
