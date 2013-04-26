var Montage = require("montage").Montage,
    EditingDocument = require("palette/core/editing-document").EditingDocument,
    ColladaEditor = require("ui/collada-editor.reel").ColladaEditor;

exports.ColladaDocument = Montage.create(EditingDocument, {

    compiledFileURL: { value: null, writable: true },

    editorType: {
        get: function () {
            return ColladaEditor;
        }
    }

});
