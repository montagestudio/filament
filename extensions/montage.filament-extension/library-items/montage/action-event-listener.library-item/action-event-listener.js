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

    description: {
        value: "Defines what should be done in reaction to an event."
    },

    iconUrl: {
        value: moduleLocation + "action-event-listener.png"
    }

});
