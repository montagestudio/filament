var Editor = require("palette/ui/editor.reel").Editor;

exports.Viewer = Editor.specialize({

    constructor: {
        value: function Viewer() {
            this.super();
        }
    },

    openDocument: {
        value: function (editingDocument) {
            if (editingDocument) {
                editingDocument.editor = this;
            }
        }
    }
});
