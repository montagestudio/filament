/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.SceneView = LibraryItem.specialize({

    constructor: {
        value: function SceneViewLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Scene View"
    },

    iconUrl: {
        value: moduleLocation + "scene-view.png"
    }

});
