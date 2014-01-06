/* globals module */
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

var moduleLocation = module.location.replace(/[^\/]+.js$/m, "");

exports.VideoPlayer = LibraryItem.specialize({

    constructor: {
        value: function VideoPlayerLibraryItem () {
            this.super();
        }
    },

    name: {
        value: "Video Player"
    },

    iconUrl: {
        value: moduleLocation + "video-player.png"
    }

});
