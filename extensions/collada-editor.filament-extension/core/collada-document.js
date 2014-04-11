var EditingDocument = require("palette/core/editing-document").EditingDocument,
    ColladaEditor = require("ui/collada-editor.reel").ColladaEditor;

exports.ColladaDocument = EditingDocument.specialize ({

    compiledFileURL: { value: null, writable: true },

    constructor: {
        value: function ColladaDocument(fileUrl) {
            this.super(fileUrl);
        }
    }

}, {
    editorType: {
        get: function () {
            return ColladaEditor;
        }
    }

});
