var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;


var ColladaViewLibraryItem = LibraryItem.specialize( {

    constructor: {
        value: function ColladaViewLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "glTF-webgl-viewer/ui/view.reel",
            "properties": {
                "element": {
                    "#": "component"
                }
            }
        }
    },

    name: {
        value: "Collada View"
    },

    label: {
        value: "Collada View"
    },

    icon: {
        value: packageLocation + "assets/components/collada-view.png"
    },

    html: {
        value: '<div data-montage-id="component"><canvas data-montage-id="canvas"></canvas></div>'
    }

});


//TODO build this automatically
exports.libraryItems = {
    "glTF-webgl-viewer/ui/view.reel": ColladaViewLibraryItem
};

exports.libraryAdditions = [];
