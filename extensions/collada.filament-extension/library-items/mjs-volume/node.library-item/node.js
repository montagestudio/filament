/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Node = LibraryItem.specialize({

    constructor: {
        value: function NodeLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Node"
    },

    iconUrl: {
        value: moduleLocation + "node.png"
    }

});
