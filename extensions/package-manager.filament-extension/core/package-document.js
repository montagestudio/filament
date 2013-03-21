var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    PackageEditor = require("ui/package-editor.reel").PackageEditor;

exports.PackageDocument = Montage.create(EditingDocument, {

    editorType: {
        get: function () {
            return PackageEditor;
        }
    }

});
