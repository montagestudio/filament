/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.PromiseController = LibraryItem.specialize({

    constructor: {
        value: function PromiseControllerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "PromiseController"
    },

    description: {
        value: "Exposes the state of a promise with bindable properties."
    },

    iconUrl: {
        value: moduleLocation + "promise-controller.png"
    }

});

