var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    Viewer = require("ui/viewer.reel").Viewer;

exports.ImageDocument = EditingDocument.specialize({

    constructor: {
        value: function ImageDocument () {
            this.super();
        }
    }

}, {

    editorType: {
        get: function () {
            return Viewer;
        }
    }

});
