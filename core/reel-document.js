var Montage = require("montage").Montage,
    ReelDocument = require("palette/core/reel-document").ReelDocument,
    ComponentEditor = require("ui/component-editor.reel").ComponentEditor;

exports.ReelDocument = Montage.create(ReelDocument, {

    editorType: {
        get: function () {
            return ComponentEditor;
        }
    }

});
