var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var NodeLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function NodeLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "glTF-webgl-viewer/runtime/node"
        }
    },

    name: {
        value: "Node"
    },

    label: {
        value: "Node"
    },

    icon: {
        value: packageLocation + "assets/components/node.png"
    }

});

var MaterialLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function MaterialLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "glTF-webgl-viewer/runtime/material"
        }
    },

    name: {
        value: "Material"
    },

    label: {
        value: "Material"
    },

    icon: {
        value: packageLocation + "assets/components/material.png"
    }

});


var SceneLibraryItem = LibraryItem.specialize({

    constructor: {
        value: function SceneLibraryItem() {
            this.super();
        }
    },

    serialization: {
        value: {
            "prototype": "glTF-webgl-viewer/runtime/scene"
        }
    },

    name: {
        value: "Scene"
    },

    label: {
        value: "Scene"
    },

    icon: {
        value: packageLocation + "assets/components/scene.png"
    }

});



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
        value: packageLocation + "assets/components/view.png"
    },

    html: {
        value: '<div data-montage-id="component"><canvas data-montage-id="canvas"></canvas></div>'
    }

});


//TODO build this automatically
exports.libraryItems = {
    "glTF-webgl-viewer/ui/view.reel": ColladaViewLibraryItem
};

exports.libraryAdditions = {
    "glTF-webgl-viewer/runtime/scene": SceneLibraryItem,
    "glTF-webgl-viewer/runtime/node": NodeLibraryItem,
    "glTF-webgl-viewer/runtime/material": MaterialLibraryItem
};
