/**
 * @module ui/template-explorer.reel/content/edit-comment.reel
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    RichTextEditor = require("matte/ui/rich-text-editor/rich-text-editor.reel").RichTextEditor;

/**
 * @class EditComment
 * @extends module:matte/ui/rich-text-editor/rich-text-editor.reel.RichTextEditor
 
 */
exports.EditComment = Montage.create(RichTextEditor, /** @lends EditComment# */ {

    templateModuleId: {
        value: "matte/ui/rich-text-editor/rich-text-editor.reel/rich-text-editor.html"
    },

    undoManager: {
        enumerable: true,
        get: function() {
            return this.ownerComponent.templateObject._editingDocument.undoManager;
        },
        set: function(value) {
            this._undoManager = this.ownerComponent.templateObject._editingDocument.undoManager;
        }
    }

});