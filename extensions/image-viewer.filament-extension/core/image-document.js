var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    Viewer = require("ui/viewer.reel").Viewer;

exports.ImageDocument = Montage.create(EditingDocument, {

    editorType: {
        get: function () {
            return Viewer;
        }
    }

});
