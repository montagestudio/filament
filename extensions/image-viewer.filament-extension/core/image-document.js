var EditingDocument = require("palette/core/editing-document").EditingDocument,
    Viewer = require("ui/viewer.reel").Viewer;

exports.ImageDocument = EditingDocument.specialize({

    constructor: {
        value: function ImageDocument(fileUrl) {
            this.super(fileUrl);
        }
    }

}, {

    editorType: {
        get: function () {
            return Viewer;
        }
    }

});
