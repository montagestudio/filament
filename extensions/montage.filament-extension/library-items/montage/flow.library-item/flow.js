/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Flow = LibraryItem.specialize({

    constructor: {
        value: function FlowLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Flow"
    },

    description: {
        value: "Produces a repeating group of elements that can be presented along a Bézier path."
    },

    iconUrl: {
        value: moduleLocation + "flow.png"
    }

});
