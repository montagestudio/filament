/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.ActionEventListener = LibraryItem.specialize({

    constructor: {
        value: function ActionEventListenerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "ActionEventListener"
    },

    iconUrl: {
        value: moduleLocation + "action-event-listener.png"
    }

});
