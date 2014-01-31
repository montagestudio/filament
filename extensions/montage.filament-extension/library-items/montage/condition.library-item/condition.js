/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Condition = LibraryItem.specialize({

    constructor: {
        value: function ConditionLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Condition"
    },

    description: {
        value: "Displays content if a certain condition is true."
    },

    iconUrl: {
        value: moduleLocation + "condition.png"
    }

});
