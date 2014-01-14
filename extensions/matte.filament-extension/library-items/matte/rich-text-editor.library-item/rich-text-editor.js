/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.RichTextEditor = LibraryItem.specialize({

    constructor: {
        value: function RichTextEditorLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Rich Text Editor"
    },

    iconUrl: {
        value: moduleLocation + "rich-text-editor.png"
    }

});
