/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.Scene = LibraryItem.specialize({

    constructor: {
        value: function SceneLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Scene"
    },

    iconUrl: {
        value: moduleLocation + "scene.png"
    }

});
